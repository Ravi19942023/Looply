import { randomUUID } from "node:crypto";

import type { IStorageAdapter } from "@/backend/adapters/storage";
import type { IVectorAdapter } from "@/backend/adapters/vector";
import type { IAuditService } from "@/backend/modules/audit";
import { AUDIT_EVENTS } from "@/backend/modules/audit";
import type { IngestionService } from "@/backend/modules/rag";
import { ValidationError } from "@/backend/lib";
import { getChatById, saveChat } from "@/lib/db/queries";
import { ALLOWED_UPLOAD_TYPES, SESSION_MAX_UPLOAD_SIZE_BYTES } from "@/backend/modules/uploads/upload.constants";
import { extractText, isReadableExtractedText } from "@/backend/modules/uploads/upload.service";
import { ICacheService } from "@/backend/lib/redis";
import type { IChatDocumentRepository } from "./chat-document.repository.interface";
import type { ChatDocumentRecord, UploadChatDocumentInput } from "./chat-file.types";

const EXTRA_ALLOWED_UPLOAD_TYPES = ["text/markdown"] as const;
const SESSION_ALLOWED_UPLOAD_TYPES = [...ALLOWED_UPLOAD_TYPES, ...EXTRA_ALLOWED_UPLOAD_TYPES];

export class ChatFileService {
  constructor(
    private readonly repository: IChatDocumentRepository,
    private readonly storageAdapter: IStorageAdapter,
    private readonly vectorAdapter: IVectorAdapter,
    private readonly ingestionService: IngestionService,
    private readonly cacheService: ICacheService,
    private readonly auditService: IAuditService,
  ) {}

  async list(chatId: string, actorId: string): Promise<ChatDocumentRecord[]> {
    return this.repository.findByChatAndActor(chatId, actorId);
  }

  async upload(input: UploadChatDocumentInput): Promise<ChatDocumentRecord> {
    if (!SESSION_ALLOWED_UPLOAD_TYPES.includes(input.contentType as (typeof SESSION_ALLOWED_UPLOAD_TYPES)[number])) {
      throw new ValidationError(`Unsupported file type: ${input.contentType}`);
    }

    if (input.content.byteLength > SESSION_MAX_UPLOAD_SIZE_BYTES) {
      throw new ValidationError("File exceeds session upload size limit (1MB).");
    }

    const existingChat = await getChatById({ id: input.chatId });
    if (!existingChat) {
      await saveChat({
        id: input.chatId,
        actorId: input.actorId,
        title: "New chat",
      });
    } else if (existingChat.actorId !== input.actorId) {
      throw new ValidationError("Chat does not belong to the current actor.");
    }

    const extraction = await extractText(input.content, input.contentType);
    if (!isReadableExtractedText(extraction.text)) {
      throw new ValidationError("Extracted text is empty or unreadable.");
    }

    const key = `chat-documents/${input.actorId}/${input.chatId}/${randomUUID()}-${input.fileName}`;
    const upload = await this.storageAdapter.upload({
      key,
      body: input.content,
      contentType: input.contentType,
    });

    let ingested;
    try {
      ingested = await this.ingestionService.ingest(extraction.text, {
        actorId: input.actorId,
        documentId: randomUUID(),
        fileName: input.fileName,
        key: upload.key,
        url: upload.url,
      });
    } catch (error) {
      await this.storageAdapter.delete(upload).catch(() => undefined);
      throw new ValidationError(
        `Ingestion failed: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }

    const document = await this.repository.create({
      chatId: input.chatId,
      actorId: input.actorId,
      key: upload.key,
      url: upload.url,
      fileName: input.fileName,
      fileSize: input.content.byteLength,
      chunkCount: ingested.result.chunkCount,
    });

    const namespace = `chat:${input.chatId}`;

    try {
      await this.vectorAdapter.upsert(
        ingested.chunks.map((chunk) => ({
          id: `${document.id}:${chunk.metadata["chunkIndex"] as number}`,
          namespace,
          values: chunk.embedding,
          metadata: {
            ...chunk.metadata,
            documentId: document.id,
            chatId: input.chatId,
            scope: "session",
          },
        })),
      );
    } catch (error) {
      console.error("[ChatFileService] Failed to store chat-file embeddings:", error);
    }

    // Cache extracted chunks for fast access (24h TTL)
    const cacheKey = `sess:doc:${input.chatId}:${document.id}`;
    await this.cacheService.set(cacheKey, ingested.chunks.map((c) => c.text), 86400);

    await this.auditService.log({
      actorId: input.actorId,
      event: AUDIT_EVENTS.DOCUMENT_UPLOADED,
      resourceType: "chat_document",
      resourceId: document.id,
      metadata: {
        chatId: input.chatId,
        key: document.key,
        chunkCount: document.chunkCount,
        scope: "session",
      },
    });

    return document;
  }

  async delete(id: string, actorId: string): Promise<void> {
    const document = await this.repository.findById(id);

    if (!document) {
      throw new Error("Document not found.");
    }

    if (document.actorId !== actorId) {
      throw new Error("Document does not belong to the current actor.");
    }

    await this.storageAdapter.delete({ key: document.key, url: document.url });
    await this.vectorAdapter.delete(`chat:${document.chatId}`, [document.id]);
    await this.repository.delete(id);

    await this.auditService.log({
      actorId,
      event: AUDIT_EVENTS.DOCUMENT_DELETED,
      resourceType: "chat_document",
      resourceId: id,
      metadata: {
        chatId: document.chatId,
        key: document.key,
        scope: "session",
      },
    });
  }
}
