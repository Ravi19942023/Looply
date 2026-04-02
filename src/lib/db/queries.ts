import { and, asc, count, desc, eq, gt, gte, inArray, isNull, lt } from "drizzle-orm";

import { db } from "@/backend/db";
import { chatArtifacts, chatArtifactVersions, chatArtifactSuggestions, chatMessages, chats, chatStreams, telemetryLogs } from "@/backend/db/schema";
import type { ArtifactKind, Attachment } from "@/lib/types";
import type { Chat, DBMessage, Document, Suggestion } from "./schema";

export async function saveChat({
  id,
  actorId,
  title,
}: {
  id: string;
  actorId: string;
  title: string;
}) {
  await db.insert(chats).values({
    id,
    actorId,
    title,
  });
}

export async function deleteChatById({ id }: { id: string }) {
  const [deletedChat] = await db
    .update(chats)
    .set({ deletedAt: new Date() })
    .where(eq(chats.id, id))
    .returning();
  return deletedChat ?? null;
}

export async function deleteAllChatsByUserId({ actorId }: { actorId: string }) {
  const result = await db
    .update(chats)
    .set({ deletedAt: new Date() })
    .where(and(eq(chats.actorId, actorId), isNull(chats.deletedAt)))
    .returning({ id: chats.id });
  
  return { deletedCount: result.length };
}

export async function getChatsByUserId({
  actorId,
  limit,
  startingAfter,
  endingBefore,
}: {
  actorId: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  const extendedLimit = limit + 1;

  const getBoundary = async (id: string) => {
    const [chat] = await db
      .select()
      .from(chats)
      .where(and(eq(chats.id, id), isNull(chats.deletedAt)))
      .limit(1);
    return chat ?? null;
  };

  let rows: Chat[] = [];

  if (startingAfter) {
    const boundary = await getBoundary(startingAfter);
    rows = boundary
      ? await db
          .select()
          .from(chats)
          .where(and(eq(chats.actorId, actorId), isNull(chats.deletedAt), gt(chats.createdAt, boundary.createdAt)))
          .orderBy(desc(chats.createdAt))
          .limit(extendedLimit)
      : [];
  } else if (endingBefore) {
    const boundary = await getBoundary(endingBefore);
    rows = boundary
      ? await db
          .select()
          .from(chats)
          .where(and(eq(chats.actorId, actorId), isNull(chats.deletedAt), lt(chats.createdAt, boundary.createdAt)))
          .orderBy(desc(chats.createdAt))
          .limit(extendedLimit)
      : [];
  } else {
    rows = await db
      .select()
      .from(chats)
      .where(and(eq(chats.actorId, actorId), isNull(chats.deletedAt)))
      .orderBy(desc(chats.createdAt))
      .limit(extendedLimit);
  }

  return {
    chats: rows.length > limit ? rows.slice(0, limit) : rows,
    hasMore: rows.length > limit,
  };
}

export async function getChatById({ id }: { id: string }) {
  const [chat] = await db
    .select()
    .from(chats)
    .where(and(eq(chats.id, id), isNull(chats.deletedAt)))
    .limit(1);
  return chat ?? null;
}

export async function saveMessages({ messages }: { messages: DBMessage[] }) {
  if (messages.length === 0) {
    return;
  }

  await db.insert(chatMessages).values(messages.map(m => ({
    ...m,
    annotations: m.annotations ?? [],
  })));
}



export async function getMessagesByChatId({ id }: { id: string }) {
  return db.select().from(chatMessages).where(eq(chatMessages.chatId, id)).orderBy(asc(chatMessages.createdAt));
}

export async function getMessageById({ id }: { id: string }) {
  return db.select().from(chatMessages).where(eq(chatMessages.id, id));
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  await db.delete(chatMessages).where(and(eq(chatMessages.chatId, chatId), gte(chatMessages.createdAt, timestamp)));
}

export async function updateChatTitleById({
  chatId,
  title,
}: {
  chatId: string;
  title: string;
}) {
  await db.update(chats).set({ title }).where(eq(chats.id, chatId));
}

export async function getMessageCountByUserId({
  actorId,
  differenceInHours,
}: {
  actorId: string;
  differenceInHours: number;
}) {
  const cutoff = new Date(Date.now() - differenceInHours * 60 * 60 * 1000);
  const [result] = await db
    .select({ count: count(chatMessages.id) })
    .from(chatMessages)
    .innerJoin(chats, eq(chatMessages.chatId, chats.id))
    .where(and(eq(chats.actorId, actorId), isNull(chats.deletedAt), gte(chatMessages.createdAt, cutoff), eq(chatMessages.role, "user")));

  return result?.count ?? 0;
}



export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
  chatId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
  chatId: string;
}) {
  const existing = await getArtifactById({ id });

  if (!existing) {
    await db.insert(chatArtifacts).values({
      id,
      chatId,
      actorId: userId,
      title,
      kind,
    });
  } else {
    await db.update(chatArtifacts).set({ title, kind, updatedAt: new Date() }).where(eq(chatArtifacts.id, id));
  }

  const [version] = await db
    .insert(chatArtifactVersions)
    .values({
      artifactId: id,
      content,
    })
    .returning();

  return version;
}

export async function getArtifactById({ id }: { id: string }) {
  const [artifact] = await db.select().from(chatArtifacts).where(eq(chatArtifacts.id, id)).limit(1);
  return artifact ?? null;
}

export async function getLatestArtifactByChatId({ chatId }: { chatId: string }) {
  const [artifact] = await db
    .select()
    .from(chatArtifacts)
    .where(eq(chatArtifacts.chatId, chatId))
    .orderBy(desc(chatArtifacts.updatedAt))
    .limit(1);

  return artifact ?? null;
}

export async function getDocumentsById({ id }: { id: string }): Promise<Document[]> {
  const artifact = await getArtifactById({ id });

  if (!artifact) {
    return [];
  }

  const versions = await db
    .select()
    .from(chatArtifactVersions)
    .where(eq(chatArtifactVersions.artifactId, id))
    .orderBy(asc(chatArtifactVersions.createdAt));

  return versions.map((version) => ({
    id: artifact.id,
    title: artifact.title,
    kind: artifact.kind,
    content: version.content,
    createdAt: version.createdAt,
    userId: artifact.actorId,
  }));
}

export async function getDocumentById({ id }: { id: string }) {
  const documents = await getDocumentsById({ id });
  return documents.at(-1) ?? null;
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  const versions = await db
    .select({ id: chatArtifactVersions.id })
    .from(chatArtifactVersions)
    .where(and(eq(chatArtifactVersions.artifactId, id), gt(chatArtifactVersions.createdAt, timestamp)));

  const versionIds = versions.map((version) => version.id);

  if (versionIds.length > 0) {
    await db.delete(chatArtifactVersions).where(inArray(chatArtifactVersions.id, versionIds));
  }
}



export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Omit<Suggestion, "createdAt">>;
}) {
  if (suggestions.length === 0) {
    return;
  }

  await db.insert(chatArtifactSuggestions).values(
    suggestions.map((s) => ({
      artifactId: s.documentId,
      actorId: s.userId,
      originalText: s.originalText,
      suggestedText: s.suggestedText,
      description: s.description,
      isResolved: s.isResolved,
      documentCreatedAt: s.documentCreatedAt,
    }))
  );
}

export type AttachmentRecord = Attachment;
