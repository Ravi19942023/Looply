import { randomUUID } from "node:crypto";
import mammoth from "mammoth";
import pdf from "pdf-parse";

import type { IStorageAdapter } from "@/backend/adapters/storage";
import type { IVectorAdapter } from "@/backend/adapters/vector";
import { ValidationError } from "@/backend/lib";
import type { IAuditService } from "@/backend/modules/audit";
import { AUDIT_EVENTS } from "@/backend/modules/audit";
import type { IngestionService } from "@/backend/modules/rag";

import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_SIZE_BYTES } from "./upload.constants";
import type { IDocumentRepository } from "./document.repository.interface";
import type { DocumentRecord, UploadDocumentInput } from "./upload.types";

interface DeleteDocumentOptions {
  bypassOwnershipCheck?: boolean;
}

type AllowedContentType = (typeof ALLOWED_UPLOAD_TYPES)[number];

interface TextExtractionResult {
  method: "pdf-parse" | "mammoth" | "utf8";
  text: string;
}

export function isReadableExtractedText(text: string): boolean {
  const normalized = text.trim();

  if (normalized.length < 10) {
    return false;
  }

  const alphanumericCount = normalized.match(/[A-Za-z0-9]/g)?.length ?? 0;
  const controlCharacterCount = normalized.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g)?.length ?? 0;
  const controlCharacterRatio = controlCharacterCount / normalized.length;
  const hasZipSignature = normalized.startsWith("PK");

  if (controlCharacterRatio > 0.05) {
    return false;
  }

  if (hasZipSignature && alphanumericCount < 20) {
    return false;
  }

  return alphanumericCount >= 5 && /[A-Za-z0-9]{3,}/.test(normalized);
}

/**
 * Extract raw text from a binary buffer based on its MIME type.
 * Text goes straight to IngestionService which handles preprocessing + chunking.
 */
export async function extractText(
  buffer: Buffer,
  contentType: string,
): Promise<TextExtractionResult> {
  switch (contentType as AllowedContentType) {
    case "application/pdf": {
      try {
        const data = await pdf(buffer);
        return {
          method: "pdf-parse",
          text: data.text ?? "",
        };
      } catch (error) {
        throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : "unknown error"}`);
      }
    }
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      try {
        const data = await mammoth.extractRawText({ buffer });
        return {
          method: "mammoth",
          text: data.value ?? "",
        };
      } catch (error) {
        throw new Error(`DOCX parsing failed: ${error instanceof Error ? error.message : "unknown error"}`);
      }
    }
    case "text/plain":
      return {
        method: "utf8",
        text: buffer.toString("utf8"),
      };
    default:
      return {
        method: "utf8",
        text: buffer.toString("utf8"),
      };
  }
}

export class UploadService {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly storageAdapter: IStorageAdapter,
    private readonly vectorAdapter: IVectorAdapter,
    private readonly ingestionService: IngestionService,
    private readonly auditService: IAuditService,
  ) {}

  async listDocuments(actorId: string): Promise<DocumentRecord[]> {
    return this.documentRepository.findByActor(actorId);
  }

  async uploadDocument(input: UploadDocumentInput): Promise<DocumentRecord> {
    if (!ALLOWED_UPLOAD_TYPES.includes(input.contentType as AllowedContentType)) {
      throw new ValidationError(`Unsupported file type: ${input.contentType}`);
    }

    if (input.content.byteLength > MAX_UPLOAD_SIZE_BYTES) {
      throw new ValidationError("File exceeds maximum upload size.");
    }

    // 1. Extract raw text before persisting the file so invalid documents do not leave orphaned uploads.
    let extraction: TextExtractionResult;

    try {
      extraction = await extractText(input.content, input.contentType);
    } catch (error) {
      throw new ValidationError(
        error instanceof Error ? error.message : "Document text extraction failed.",
      );
    }
    const readableTextDetected = isReadableExtractedText(extraction.text);

    if (!readableTextDetected) {
      throw new ValidationError("Extracted text is empty or unreadable.");
    }

    // 2. Upload to storage
    const key = `documents/${input.actorId}/${randomUUID()}-${input.fileName}`;
    const upload = await this.storageAdapter.upload({
      key,
      body: input.content,
      contentType: input.contentType,
    });

    // 3. Run ingestion pipeline: preprocess → chunk → embed
    let chunkCount = 0;
    let chunks: Awaited<ReturnType<IngestionService["ingest"]>>["chunks"] = [];

    try {
      const ingested = await this.ingestionService.ingest(extraction.text, {
        actorId: input.actorId,
        documentId: randomUUID(), // temp id — replaced after DB insert below
        fileName: input.fileName,
        key: upload.key,
        url: upload.url,
      });
      chunkCount = ingested.result.chunkCount;
      chunks = ingested.chunks;
    } catch (error) {
      await this.storageAdapter.delete(upload).catch(() => undefined);
      throw new ValidationError(
        `Ingestion failed: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }

    // 4. Create database record
    const document = await this.documentRepository.create({
      actorId: input.actorId,
      key: upload.key,
      url: upload.url,
      fileName: input.fileName,
      fileSize: input.content.byteLength,
      chunkCount,
      inContext: true,
    });

    // 5. Store embeddings in vector DB using the real document ID
    try {
      await this.vectorAdapter.upsert(
        chunks.map((chunk) => ({
          id: `${document.id}:${chunk.metadata["chunkIndex"] as number}`,
          namespace: input.actorId,
          values: chunk.embedding,
          metadata: {
            ...chunk.metadata,
            documentId: document.id,
          },
        })),
      );
    } catch (error) {
      // Log but don't fail — file is already stored; embeddings can be retried
      console.error("[UploadService] Failed to store embeddings:", error);
    }

    // 6. Audit log
    await this.auditService.log({
      actorId: input.actorId,
      event: AUDIT_EVENTS.DOCUMENT_UPLOADED,
      resourceType: "document",
      resourceId: document.id,
      metadata: {
        key: document.key,
        chunkCount,
        extractionMethod: extraction.method,
        extractedCharacterCount: extraction.text.length,
        readableTextDetected,
      },
    });

    return document;
  }

  async deleteDocument(
    id: string,
    actorId: string,
    options: DeleteDocumentOptions = {},
  ): Promise<void> {
    const document = await this.documentRepository.findById(id);

    if (!document) {
      throw new Error("Document not found.");
    }

    if (!options.bypassOwnershipCheck && document.actorId !== actorId) {
      throw new Error("Document does not belong to the current actor.");
    }

    await this.storageAdapter.delete({ key: document.key, url: document.url });
    await this.vectorAdapter.delete(document.actorId, [document.id]);
    await this.documentRepository.delete(id);

    await this.auditService.log({
      actorId,
      event: AUDIT_EVENTS.DOCUMENT_DELETED,
      resourceType: "document",
      resourceId: id,
      metadata: { key: document.key },
    });
  }

  async toggleDocumentContext(
    id: string,
    inContext: boolean,
    actorId: string,
  ): Promise<DocumentRecord | null> {
    const document = await this.documentRepository.findById(id);

    if (!document) {
      throw new Error("Document not found.");
    }

    if (document.actorId !== actorId) {
      throw new Error("Document does not belong to the current actor.");
    }

    const result = await this.documentRepository.toggleContext(id, inContext);

    await this.auditService.log({
      actorId,
      event: AUDIT_EVENTS.DOCUMENT_CONTEXT_UPDATED,
      resourceType: "document",
      resourceId: id,
      metadata: { inContext },
    });

    return result;
  }
}
