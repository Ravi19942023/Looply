import { desc, eq } from "drizzle-orm";

import { db } from "@/backend/db";
import { chatDocuments } from "@/backend/db/schema";

import type { IChatDocumentRepository } from "./chat-document.repository.interface";
import type { ChatDocumentRecord, CreateChatDocumentInput } from "./chat-file.types";

export class ChatDocumentRepository implements IChatDocumentRepository {
  async findById(id: string): Promise<ChatDocumentRecord | null> {
    const result = await db.query.chatDocuments.findFirst({
      where: eq(chatDocuments.id, id),
    });

    return (result as ChatDocumentRecord | null) ?? null;
  }

  async findByChat(chatId: string): Promise<ChatDocumentRecord[]> {
    const result = await db.query.chatDocuments.findMany({
      where: eq(chatDocuments.chatId, chatId),
      orderBy: desc(chatDocuments.createdAt),
    });

    return result as ChatDocumentRecord[];
  }

  async findByChatAndActor(chatId: string, actorId: string): Promise<ChatDocumentRecord[]> {
    const result = await db.query.chatDocuments.findMany({
      where: (document, { and, eq }) => and(eq(document.chatId, chatId), eq(document.actorId, actorId)),
      orderBy: desc(chatDocuments.createdAt),
    });

    return result as ChatDocumentRecord[];
  }

  async create(input: CreateChatDocumentInput): Promise<ChatDocumentRecord> {
    const [result] = await db.insert(chatDocuments).values(input).returning();
    return result as ChatDocumentRecord;
  }

  async delete(id: string): Promise<void> {
    await db.delete(chatDocuments).where(eq(chatDocuments.id, id));
  }
}
