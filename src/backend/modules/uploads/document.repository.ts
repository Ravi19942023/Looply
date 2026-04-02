import { desc, eq } from "drizzle-orm";

import { db } from "@/backend/db";
import { documents } from "@/backend/db/schema";

import type { IDocumentRepository } from "./document.repository.interface";
import type { CreateDocumentInput, DocumentRecord } from "./upload.types";

export class DocumentRepository implements IDocumentRepository {
  async findById(id: string): Promise<DocumentRecord | null> {
    const result = await db.query.documents.findFirst({
      where: eq(documents.id, id),
    });

    return (result as DocumentRecord | null) ?? null;
  }

  async findByActor(actorId: string): Promise<DocumentRecord[]> {
    const result = await db.query.documents.findMany({
      where: eq(documents.actorId, actorId),
      orderBy: desc(documents.createdAt),
    });

    return result as DocumentRecord[];
  }

  async findInContext(): Promise<DocumentRecord[]> {
    const result = await db.query.documents.findMany({
      where: eq(documents.inContext, true),
      orderBy: desc(documents.createdAt),
    });

    return result as DocumentRecord[];
  }

  async findInContextByActor(actorId: string): Promise<DocumentRecord[]> {
    const result = await db.query.documents.findMany({
      where: (document, { and, eq }) => and(eq(document.actorId, actorId), eq(document.inContext, true)),
      orderBy: desc(documents.createdAt),
    });

    return result as DocumentRecord[];
  }

  async create(input: CreateDocumentInput): Promise<DocumentRecord> {
    const [result] = await db.insert(documents).values(input).returning();

    return result as DocumentRecord;
  }

  async delete(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  async toggleContext(id: string, inContext: boolean): Promise<DocumentRecord | null> {
    const [result] = await db
      .update(documents)
      .set({ inContext })
      .where(eq(documents.id, id))
      .returning();

    return (result as DocumentRecord | undefined) ?? null;
  }
}
