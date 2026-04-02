import { desc, eq } from "drizzle-orm";

import { db } from "@/backend/db";
import { conversationMessages, userMemory } from "@/backend/db/schema";

import type { IMemoryRepository } from "./memory.repository.interface";
import type { AppendMessageInput, ConversationRecord, MemoryRecord } from "./memory.types";

export class MemoryRepository implements IMemoryRepository {
  async findByUserId(userId: string): Promise<MemoryRecord | null> {
    const result = await db.query.userMemory.findFirst({
      where: eq(userMemory.userId, userId),
    });

    return result ?? null;
  }

  async findRecentMessages(sessionId: string, limit: number): Promise<ConversationRecord[]> {
    const result = await db.query.conversationMessages.findMany({
      where: eq(conversationMessages.sessionId, sessionId),
      orderBy: desc(conversationMessages.createdAt),
      limit,
    });

    return [...result].reverse();
  }

  async findAllMessages(sessionId: string): Promise<ConversationRecord[]> {
    const result = await db.query.conversationMessages.findMany({
      where: eq(conversationMessages.sessionId, sessionId),
      orderBy: desc(conversationMessages.createdAt),
    });

    return [...result].reverse();
  }

  async appendMessage(input: AppendMessageInput): Promise<void> {
    await db.insert(conversationMessages).values({
      sessionId: input.sessionId,
      role: input.role,
      content: input.content,
      parts: input.parts ?? [],
      attachments: input.attachments ?? [],
    });
  }

  async updateMemoryField(userId: string, field: string, value: unknown): Promise<void> {
    await db
      .update(userMemory)
      .set({ [field]: value, updatedAt: new Date() })
      .where(eq(userMemory.userId, userId));
  }
}
