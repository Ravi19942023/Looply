import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  like,
  or,
  sql,
} from "drizzle-orm";
import { buildPaginationMeta } from "@/lib/pagination";
import { db } from "../client";
import {
  auditLog,
  campaign,
  campaignLog,
  chat,
  chatDocument,
  customer,
  customerMetric,
  document,
  documentEmbedding,
  emailLog,
  jobRun,
  knowledgeDocument,
  message,
  ragTelemetryLog,
  stream,
  suggestion,
  user,
  userMemory,
  vote,
} from "../schema";
import { generateHashedPassword } from "../utils";

type PaginationInput = {
  page: number;
  pageSize: number;
};

type CustomerDirectorySort = "churn" | "revenue";
type CampaignDirectoryStatus = "all" | "draft" | "sent" | "partial" | "failed";

export type SystemActivityType =
  | "all"
  | "campaign"
  | "chat"
  | "document"
  | "email"
  | "knowledge"
  | "message";

type AuditLogInsert = typeof auditLog.$inferInsert;
type CampaignLogInsert = typeof campaignLog.$inferInsert;
type ChatInsert = typeof chat.$inferInsert;
type EmailLogInsert = typeof emailLog.$inferInsert;
type JobRunInsert = typeof jobRun.$inferInsert;
type MessageInsert = typeof message.$inferInsert;
type RagTelemetryLogInsert = typeof ragTelemetryLog.$inferInsert;
type StreamInsert = typeof stream.$inferInsert;
type SuggestionInsert = typeof suggestion.$inferInsert;
type UserInsert = typeof user.$inferInsert;

type CustomerRow = {
  avgOrderValue: string | null;
  churnRiskScore: string | null;
  email: string;
  id: string;
  lastPurchaseAt: Date | null;
  ltv: string | null;
  name: string;
  orderCount: number | null;
  phone: string | null;
  segment: string;
  tags: string[];
  totalRevenue: string | null;
};

const DEFAULT_USER_ROLE = "manager";
const DEFAULT_CHAT_TITLE = "New chat";
const DEFAULT_DOCUMENT_KIND = "text";
const CHAT_USAGE_SOURCE = "llm:chat";
const RAG_USAGE_PREFIX = "rag:";
const CHAT_INPUT_COST_PER_1K = 0.000_15;
const CHAT_OUTPUT_COST_PER_1K = 0.0006;
const RAG_TOKEN_COST_PER_1K = 0.000_02;

function paginateItems<T>(items: T[], input: PaginationInput) {
  const pagination = buildPaginationMeta({
    page: input.page,
    pageSize: input.pageSize,
    total: items.length,
  });
  const offset = (pagination.page - 1) * pagination.pageSize;

  return {
    items: items.slice(offset, offset + pagination.pageSize),
    pagination,
  };
}

function isWithinDays(value: Date | null | undefined, days: number) {
  if (!value) {
    return false;
  }

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return value.getTime() >= cutoff;
}

function formatBucketKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function formatBucketLabel(value: Date) {
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function numberValue(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

async function getCustomerRows(): Promise<CustomerRow[]> {
  const rows = await db
    .select({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      segment: customer.segment,
      tags: customer.tags,
      totalRevenue: customerMetric.totalRevenue,
      ltv: customerMetric.ltv,
      orderCount: customerMetric.orderCount,
      avgOrderValue: customerMetric.avgOrderValue,
      lastPurchaseAt: customerMetric.lastPurchaseAt,
      churnRiskScore: customerMetric.churnRiskScore,
    })
    .from(customer)
    .leftJoin(customerMetric, eq(customerMetric.customerId, customer.id));

  return rows.map((row) => ({
    ...row,
    tags: row.tags ?? [],
  }));
}

async function deleteChatsByIds(chatIds: string[]) {
  if (chatIds.length === 0) {
    return { deletedCount: 0 };
  }

  const chatDocumentRows = await db
    .select({ id: chatDocument.id })
    .from(chatDocument)
    .where(inArray(chatDocument.chatId, chatIds));

  const chatDocumentIds = chatDocumentRows.map((row) => row.id);

  await db.transaction(async (tx) => {
    if (chatDocumentIds.length > 0) {
      await tx
        .delete(documentEmbedding)
        .where(
          or(
            inArray(documentEmbedding.chatDocumentId, chatDocumentIds),
            inArray(documentEmbedding.chatId, chatIds)
          )
        );

      await tx
        .delete(chatDocument)
        .where(inArray(chatDocument.id, chatDocumentIds));
    } else {
      await tx
        .delete(documentEmbedding)
        .where(inArray(documentEmbedding.chatId, chatIds));
    }

    await tx.delete(vote).where(inArray(vote.chatId, chatIds));
    await tx.delete(stream).where(inArray(stream.chatId, chatIds));
    await tx
      .delete(ragTelemetryLog)
      .where(inArray(ragTelemetryLog.chatId, chatIds));
    await tx.delete(message).where(inArray(message.chatId, chatIds));
    await tx.delete(chat).where(inArray(chat.id, chatIds));
  });

  return { deletedCount: chatIds.length };
}

export function getUser(email: string) {
  return db.select().from(user).where(eq(user.email, email)).limit(1);
}

export async function getUserById({ id }: { id: string }) {
  const [row] = await db.select().from(user).where(eq(user.id, id)).limit(1);
  return row ?? null;
}

export async function createUser(email: string, password: string) {
  const values: UserInsert = {
    email,
    password: generateHashedPassword(password),
    role: DEFAULT_USER_ROLE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const [createdUser] = await db.insert(user).values(values).returning();
  return createdUser;
}

export async function getChatById({ id }: { id: string }) {
  const [row] = await db.select().from(chat).where(eq(chat.id, id)).limit(1);
  return row ?? null;
}

export async function saveChat(input: {
  id: string;
  userId: string;
  title?: string;
  visibility: "private" | "public";
}) {
  const values: ChatInsert = {
    id: input.id,
    createdAt: new Date(),
    title: input.title ?? DEFAULT_CHAT_TITLE,
    userId: input.userId,
    visibility: input.visibility,
  };

  const [savedChat] = await db
    .insert(chat)
    .values(values)
    .onConflictDoUpdate({
      target: chat.id,
      set: {
        title: values.title,
        visibility: values.visibility,
      },
    })
    .returning();

  return savedChat;
}

export async function getChatsByUserId(input: {
  id: string;
  limit: number;
  startingAfter?: string | null;
  endingBefore?: string | null;
}) {
  const chats = await db
    .select()
    .from(chat)
    .where(eq(chat.userId, input.id))
    .orderBy(desc(chat.createdAt), desc(chat.id));

  let startIndex = 0;

  if (input.startingAfter) {
    const cursorIndex = chats.findIndex(
      (entry) => entry.id === input.startingAfter
    );
    startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
  }

  if (input.endingBefore) {
    const cursorIndex = chats.findIndex(
      (entry) => entry.id === input.endingBefore
    );
    startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
  }

  const pagedChats = chats.slice(startIndex, startIndex + input.limit);

  return {
    chats: pagedChats,
    hasMore: startIndex + input.limit < chats.length,
  };
}

export async function deleteChatById({ id }: { id: string }) {
  const [existingChat] = await db
    .select()
    .from(chat)
    .where(eq(chat.id, id))
    .limit(1);

  if (!existingChat) {
    return null;
  }

  await deleteChatsByIds([id]);

  return existingChat;
}

export async function deleteAllChatsByUserId({ userId }: { userId: string }) {
  const rows = await db
    .select({ id: chat.id })
    .from(chat)
    .where(eq(chat.userId, userId));

  return deleteChatsByIds(rows.map((row) => row.id));
}

export async function updateChatTitleById(input: {
  chatId: string;
  title: string;
}) {
  const [updatedChat] = await db
    .update(chat)
    .set({ title: input.title })
    .where(eq(chat.id, input.chatId))
    .returning();

  return updatedChat ?? null;
}

export async function updateChatVisibilityById(input: {
  chatId: string;
  visibility: "private" | "public";
}) {
  const [updatedChat] = await db
    .update(chat)
    .set({ visibility: input.visibility })
    .where(eq(chat.id, input.chatId))
    .returning();

  return updatedChat ?? null;
}

export function getMessageById({ id }: { id: string }) {
  return db.select().from(message).where(eq(message.id, id)).limit(1);
}

export async function getMessagesByChatId(input: {
  id: string;
  limit?: number;
}) {
  if (input.limit) {
    const rows = await db
      .select()
      .from(message)
      .where(eq(message.chatId, input.id))
      .orderBy(desc(message.createdAt), desc(message.id))
      .limit(input.limit);

    return rows.reverse();
  }

  return db
    .select()
    .from(message)
    .where(eq(message.chatId, input.id))
    .orderBy(asc(message.createdAt), asc(message.id));
}

export function saveMessages(input: { messages: MessageInsert[] }) {
  if (input.messages.length === 0) {
    return Promise.resolve([]);
  }

  return db
    .insert(message)
    .values(input.messages)
    .onConflictDoUpdate({
      target: message.id,
      set: {
        parts: sql`excluded."parts"`,
        attachments: sql`excluded."attachments"`,
        createdAt: sql`excluded."createdAt"`,
      },
    })
    .returning();
}

export async function updateMessage(input: {
  id: string;
  parts: typeof message.$inferInsert.parts;
}) {
  const [updatedMessage] = await db
    .update(message)
    .set({ parts: input.parts })
    .where(eq(message.id, input.id))
    .returning();

  return updatedMessage ?? null;
}

export async function deleteMessagesByChatIdAfterTimestamp(input: {
  chatId: string;
  timestamp: Date;
}) {
  const deletedMessages = await db
    .select({ messageId: message.id })
    .from(message)
    .where(
      and(
        eq(message.chatId, input.chatId),
        gt(message.createdAt, input.timestamp)
      )
    );

  if (deletedMessages.length > 0) {
    await db.delete(vote).where(
      inArray(
        vote.messageId,
        deletedMessages.map((row) => row.messageId)
      )
    );
  }

  return db
    .delete(message)
    .where(
      and(
        eq(message.chatId, input.chatId),
        gt(message.createdAt, input.timestamp)
      )
    )
    .returning();
}

export async function getMessageCountByUserId(input: {
  id: string;
  differenceInHours: number;
}) {
  const since = new Date(Date.now() - input.differenceInHours * 60 * 60 * 1000);
  const [result] = await db
    .select({ count: count() })
    .from(message)
    .innerJoin(chat, eq(chat.id, message.chatId))
    .where(and(eq(chat.userId, input.id), gte(message.createdAt, since)));

  return Number(result?.count ?? 0);
}

export function getVotesByChatId({ id }: { id: string }) {
  return db.select().from(vote).where(eq(vote.chatId, id));
}

export async function voteMessage(input: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
}) {
  const isUpvoted = input.type === "up";

  const [savedVote] = await db
    .insert(vote)
    .values({
      chatId: input.chatId,
      messageId: input.messageId,
      isUpvoted,
    })
    .onConflictDoUpdate({
      target: [vote.chatId, vote.messageId],
      set: {
        isUpvoted,
      },
    })
    .returning();

  return savedVote;
}

export async function saveDocument(input: {
  id: string;
  title: string;
  kind: string;
  content: string;
  userId: string;
}) {
  const [savedDocument] = await db
    .insert(document)
    .values({
      id: input.id,
      createdAt: new Date(),
      title: input.title,
      kind: input.kind as typeof document.$inferInsert.kind,
      content: input.content,
      userId: input.userId,
    })
    .returning();

  return savedDocument;
}

export function getDocumentsById({ id }: { id: string }) {
  return db
    .select()
    .from(document)
    .where(eq(document.id, id))
    .orderBy(asc(document.createdAt));
}

export async function getDocumentById({ id }: { id: string }) {
  const [row] = await db
    .select()
    .from(document)
    .where(eq(document.id, id))
    .orderBy(desc(document.createdAt))
    .limit(1);

  return row ?? null;
}

export async function updateDocumentContent(input: {
  id: string;
  content: string;
}) {
  const latestDocument = await getDocumentById({ id: input.id });

  if (!latestDocument) {
    return null;
  }

  const [updatedDocument] = await db
    .update(document)
    .set({ content: input.content })
    .where(
      and(
        eq(document.id, latestDocument.id),
        eq(document.createdAt, latestDocument.createdAt)
      )
    )
    .returning();

  return updatedDocument ?? null;
}

export function deleteDocumentsByIdAfterTimestamp(input: {
  id: string;
  timestamp: Date;
}) {
  return db
    .delete(document)
    .where(
      and(eq(document.id, input.id), gt(document.createdAt, input.timestamp))
    )
    .returning();
}

export function saveSuggestions(input: { suggestions: SuggestionInsert[] }) {
  if (input.suggestions.length === 0) {
    return Promise.resolve([]);
  }

  return db.insert(suggestion).values(input.suggestions).returning();
}

export function getSuggestionsByDocumentId(input: { documentId: string }) {
  return db
    .select()
    .from(suggestion)
    .where(eq(suggestion.documentId, input.documentId))
    .orderBy(asc(suggestion.createdAt));
}

export async function createAuditLog(input: {
  actorId?: string | null;
  event: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const values: AuditLogInsert = {
    actorId: input.actorId ?? null,
    event: input.event,
    resourceType: input.resourceType,
    resourceId: input.resourceId ?? null,
    metadata: input.metadata ?? {},
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    timestamp: new Date(),
  };

  const [savedAuditLog] = await db.insert(auditLog).values(values).returning();
  return savedAuditLog;
}

export async function createJobRun(input: {
  jobName: string;
  retryCount: number;
}) {
  const values: JobRunInsert = {
    jobName: input.jobName,
    retryCount: input.retryCount,
    status: "running",
    processedCount: 0,
    startedAt: new Date(),
  };

  const [savedJobRun] = await db.insert(jobRun).values(values).returning();
  return savedJobRun ?? null;
}

export async function getLatestRunningJob(input: { jobName: string }) {
  const [row] = await db
    .select()
    .from(jobRun)
    .where(and(eq(jobRun.jobName, input.jobName), eq(jobRun.status, "running")))
    .orderBy(desc(jobRun.startedAt))
    .limit(1);

  return row ?? null;
}

export async function getLatestJobRun(input: { jobName: string }) {
  const [row] = await db
    .select()
    .from(jobRun)
    .where(eq(jobRun.jobName, input.jobName))
    .orderBy(desc(jobRun.startedAt))
    .limit(1);

  return row ?? null;
}

export async function updateJobRun(input: {
  id: string;
  status: "success" | "failed" | "running";
  processedCount?: number;
  error?: string | null;
}) {
  const [updatedJobRun] = await db
    .update(jobRun)
    .set({
      status: input.status,
      processedCount:
        input.processedCount === undefined
          ? sql`${jobRun.processedCount}`
          : input.processedCount,
      error: input.error ?? null,
      finishedAt: input.status === "running" ? null : new Date(),
    })
    .where(eq(jobRun.id, input.id))
    .returning();

  return updatedJobRun ?? null;
}

export async function createStreamId(input: {
  streamId: string;
  chatId: string;
}) {
  const values: StreamInsert = {
    id: input.streamId,
    chatId: input.chatId,
    createdAt: new Date(),
  };

  const [savedStream] = await db.insert(stream).values(values).returning();
  return savedStream;
}

export async function createUsageLog(input: {
  actorId: string;
  chatId?: string | null;
  source: string;
  model?: string | null;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  metadata?: Record<string, unknown>;
}) {
  const values: RagTelemetryLogInsert = {
    actorId: input.actorId,
    chatId: input.chatId ?? null,
    source: input.source,
    model: input.model ?? null,
    promptTokens: input.promptTokens,
    completionTokens: input.completionTokens,
    totalTokens: input.totalTokens,
    metadata: input.metadata ?? {},
    createdAt: new Date(),
  };

  const [savedLog] = await db
    .insert(ragTelemetryLog)
    .values(values)
    .returning();
  return savedLog;
}

export async function getTelemetryOverview(input: { days: number }) {
  const [messages, chats, documents, campaigns, deliveries] = await Promise.all(
    [
      db
        .select({ createdAt: message.createdAt, role: message.role })
        .from(message),
      db.select({ createdAt: chat.createdAt }).from(chat),
      db.select({ createdAt: document.createdAt }).from(document),
      db
        .select({ createdAt: campaign.createdAt, status: campaign.status })
        .from(campaign),
      db
        .select({ sentAt: emailLog.sentAt, status: emailLog.status })
        .from(emailLog),
    ]
  );

  const filteredMessages = messages.filter((row) =>
    isWithinDays(row.createdAt, input.days)
  );
  const filteredChats = chats.filter((row) =>
    isWithinDays(row.createdAt, input.days)
  );
  const filteredDocuments = documents.filter((row) =>
    isWithinDays(row.createdAt, input.days)
  );
  const filteredCampaigns = campaigns.filter((row) =>
    isWithinDays(row.createdAt, input.days)
  );
  const filteredDeliveries = deliveries.filter((row) =>
    isWithinDays(row.sentAt, input.days)
  );

  const buckets = new Map<
    string,
    {
      key: string;
      label: string;
      messages: number;
      chats: number;
      documents: number;
      campaigns: number;
    }
  >();

  const ensureBucket = (createdAt: Date) => {
    const key = formatBucketKey(createdAt);

    if (!buckets.has(key)) {
      buckets.set(key, {
        key,
        label: formatBucketLabel(createdAt),
        messages: 0,
        chats: 0,
        documents: 0,
        campaigns: 0,
      });
    }

    const bucket = buckets.get(key);

    if (!bucket) {
      throw new Error(`Missing telemetry bucket for ${key}`);
    }

    return bucket;
  };

  for (const row of filteredMessages) {
    ensureBucket(row.createdAt).messages += 1;
  }

  for (const row of filteredChats) {
    ensureBucket(row.createdAt).chats += 1;
  }

  for (const row of filteredDocuments) {
    ensureBucket(row.createdAt).documents += 1;
  }

  for (const row of filteredCampaigns) {
    ensureBucket(row.createdAt).campaigns += 1;
  }

  return {
    days: input.days,
    totals: {
      messages: filteredMessages.length,
      assistantMessages: filteredMessages.filter(
        (row) => row.role === "assistant"
      ).length,
      userMessages: filteredMessages.filter((row) => row.role === "user")
        .length,
      chats: filteredChats.length,
      campaigns: filteredCampaigns.length,
      documents: filteredDocuments.length,
      emailDeliveries: filteredDeliveries.length,
      emailFailures: filteredDeliveries.filter((row) => row.status === "failed")
        .length,
      sentCampaigns: filteredCampaigns.filter((row) => row.status === "sent")
        .length,
    },
    series: [...buckets.values()].sort((left, right) =>
      left.key.localeCompare(right.key)
    ),
  };
}

export async function getAiCostSummary(input: { days: number }) {
  const usageRows = await db
    .select({
      source: ragTelemetryLog.source,
      promptTokens: ragTelemetryLog.promptTokens,
      completionTokens: ragTelemetryLog.completionTokens,
      totalTokens: ragTelemetryLog.totalTokens,
      createdAt: ragTelemetryLog.createdAt,
    })
    .from(ragTelemetryLog);

  const filteredRows = usageRows.filter((row) =>
    isWithinDays(row.createdAt, input.days)
  );

  const chatCost = filteredRows
    .filter((row) => row.source === CHAT_USAGE_SOURCE)
    .reduce(
      (total, row) =>
        total +
        row.promptTokens * (CHAT_INPUT_COST_PER_1K / 1000) +
        row.completionTokens * (CHAT_OUTPUT_COST_PER_1K / 1000),
      0
    );

  const ragCost = filteredRows
    .filter((row) => row.source.startsWith(RAG_USAGE_PREFIX))
    .reduce(
      (total, row) => total + row.totalTokens * (RAG_TOKEN_COST_PER_1K / 1000),
      0
    );

  return {
    chatCost,
    ragCost,
    totalCost: chatCost + ragCost,
  };
}

export async function getTelemetrySummary(input: { days: number }) {
  const usageRows = await db
    .select({
      source: ragTelemetryLog.source,
      totalTokens: ragTelemetryLog.totalTokens,
      createdAt: ragTelemetryLog.createdAt,
    })
    .from(ragTelemetryLog);

  const filteredRows = usageRows.filter((row) =>
    isWithinDays(row.createdAt, input.days)
  );

  const totalTokens = filteredRows.reduce(
    (sum, row) => sum + row.totalTokens,
    0
  );
  const chatTokens = filteredRows
    .filter((row) => row.source === CHAT_USAGE_SOURCE)
    .reduce((sum, row) => sum + row.totalTokens, 0);
  const ragTokens = filteredRows
    .filter((row) => row.source.startsWith(RAG_USAGE_PREFIX))
    .reduce((sum, row) => sum + row.totalTokens, 0);

  return {
    totalTokens,
    chatTokens,
    ragTokens,
  };
}

export async function getPaginatedChatSessionsTelemetry(input: {
  days: number;
  page: number;
  pageSize: number;
}) {
  const rows = await db
    .select({
      actorEmail: user.email,
      chatId: ragTelemetryLog.chatId,
      completionTokens: ragTelemetryLog.completionTokens,
      createdAt: ragTelemetryLog.createdAt,
      model: ragTelemetryLog.model,
      promptTokens: ragTelemetryLog.promptTokens,
      title: chat.title,
      totalTokens: ragTelemetryLog.totalTokens,
    })
    .from(ragTelemetryLog)
    .leftJoin(chat, eq(ragTelemetryLog.chatId, chat.id))
    .leftJoin(user, eq(ragTelemetryLog.actorId, user.id))
    .where(eq(ragTelemetryLog.source, CHAT_USAGE_SOURCE))
    .orderBy(desc(ragTelemetryLog.createdAt));

  const filteredRows = rows.filter((row) =>
    isWithinDays(row.createdAt, input.days)
  );

  const groupedRows = Array.from(
    filteredRows
      .reduce<
        Map<
          string,
          {
            actorEmail: string | null;
            chatId: string | null;
            completionTokens: number;
            lastActivityAt: Date;
            model: string | null;
            promptTokens: number;
            startedAt: Date;
            title: string | null;
            totalTokens: number;
          }
        >
      >((groups, row) => {
        const key = `${row.chatId ?? "global"}:${row.model ?? "unknown"}`;
        const existing = groups.get(key);

        if (!existing) {
          groups.set(key, {
            actorEmail: row.actorEmail ?? null,
            chatId: row.chatId ?? null,
            completionTokens: row.completionTokens,
            lastActivityAt: row.createdAt,
            model: row.model ?? null,
            promptTokens: row.promptTokens,
            startedAt: row.createdAt,
            title: row.title ?? null,
            totalTokens: row.totalTokens,
          });
          return groups;
        }

        existing.totalTokens += row.totalTokens;
        existing.promptTokens += row.promptTokens;
        existing.completionTokens += row.completionTokens;
        if (row.createdAt < existing.startedAt) {
          existing.startedAt = row.createdAt;
        }
        if (row.createdAt > existing.lastActivityAt) {
          existing.lastActivityAt = row.createdAt;
        }

        return groups;
      }, new Map())
      .values()
  ).sort(
    (left, right) =>
      right.lastActivityAt.getTime() - left.lastActivityAt.getTime()
  );

  const pagination = buildPaginationMeta({
    page: input.page,
    pageSize: input.pageSize,
    total: groupedRows.length,
  });

  const offset = (pagination.page - 1) * pagination.pageSize;

  return {
    items: groupedRows.slice(offset, offset + pagination.pageSize),
    pagination,
  };
}

export async function getSystemActivityFeed(input: {
  page: number;
  pageSize: number;
  type: SystemActivityType;
}) {
  const [chats, messages, documents, campaigns, deliveries, knowledge] =
    await Promise.all([
      db.select().from(chat),
      db.select().from(message),
      db.select().from(document),
      db.select().from(campaign),
      db.select().from(emailLog),
      db.select().from(knowledgeDocument),
    ]);

  const items = [
    ...chats.map((row) => ({
      id: `chat:${row.id}`,
      type: "chat" as const,
      title: row.title,
      description: `${row.visibility} conversation created`,
      href: `/assistant/${row.id}`,
      createdAt: row.createdAt,
    })),
    ...messages.map((row) => ({
      id: `message:${row.id}`,
      type: "message" as const,
      title: row.role === "assistant" ? "Assistant response" : "User message",
      description: `Message added to chat ${row.chatId}`,
      href: `/assistant/${row.chatId}`,
      createdAt: row.createdAt,
    })),
    ...documents.map((row) => ({
      id: `document:${row.id}:${row.createdAt.toISOString()}`,
      type: "document" as const,
      title: row.title,
      description: `${row.kind ?? DEFAULT_DOCUMENT_KIND} document saved`,
      href: "/assistant",
      createdAt: row.createdAt,
    })),
    ...campaigns.map((row) => ({
      id: `campaign:${row.id}`,
      type: "campaign" as const,
      title: row.name,
      description: `${row.status} campaign for ${row.segment}`,
      href: "/campaigns",
      createdAt: row.updatedAt ?? row.createdAt,
    })),
    ...deliveries.map((row) => ({
      id: `email:${row.id}`,
      type: "email" as const,
      title: row.subject,
      description: `${row.status} email to ${row.recipient}`,
      href: "/campaigns",
      createdAt: row.sentAt,
    })),
    ...knowledge.map((row) => ({
      id: `knowledge:${row.id}`,
      type: "knowledge" as const,
      title: row.title,
      description: row.fileName ?? row.source,
      href: `/knowledge-base?q=${encodeURIComponent(row.title)}`,
      createdAt: row.updatedAt ?? row.createdAt,
    })),
  ]
    .filter((row) => input.type === "all" || row.type === input.type)
    .sort(
      (left, right) => right.createdAt.getTime() - left.createdAt.getTime()
    );

  return paginateItems(items, input);
}

export async function getDashboardOverview() {
  const [topCustomers, campaigns, chats, knowledgeRows, sentCampaignCountRows] =
    await Promise.all([
      getTopCustomers({ limit: 5 }),
      db.select().from(campaign).orderBy(desc(campaign.createdAt)).limit(4),
      db.select().from(chat).orderBy(desc(chat.createdAt)).limit(4),
      db
        .select()
        .from(knowledgeDocument)
        .orderBy(
          desc(knowledgeDocument.updatedAt),
          desc(knowledgeDocument.createdAt)
        )
        .limit(4),
      db
        .select({ count: count() })
        .from(campaign)
        .where(eq(campaign.status, "sent")),
    ]);

  const customerRows = await getCustomerRows();
  const totalRevenue = customerRows.reduce(
    (sum, row) => sum + numberValue(row.totalRevenue),
    0
  );

  return {
    kpis: [
      { label: "Revenue", value: totalRevenue, format: "currency" as const },
      {
        label: "Customers",
        value: customerRows.length,
        format: "number" as const,
      },
      {
        label: "Campaigns",
        value: campaigns.length,
        format: "number" as const,
      },
      { label: "Chats", value: chats.length, format: "number" as const },
    ],
    totals: {
      sentCampaignCount: Number(sentCampaignCountRows[0]?.count ?? 0),
    },
    topCustomers,
    recentCampaigns: campaigns,
    recentChats: chats,
    recentKnowledge: knowledgeRows,
  };
}

export async function getPaginatedCampaignDirectory(input: {
  page: number;
  pageSize: number;
  q: string;
  status: CampaignDirectoryStatus;
}) {
  const [campaignRows, campaignLogs] = await Promise.all([
    db.select().from(campaign).orderBy(desc(campaign.createdAt)),
    db.select().from(campaignLog),
  ]);

  const items = campaignRows
    .filter((row) => input.status === "all" || row.status === input.status)
    .filter((row) => {
      if (!input.q) {
        return true;
      }

      const haystack = [row.name, row.subject, row.segment]
        .join(" ")
        .toLowerCase();
      return haystack.includes(input.q.toLowerCase());
    })
    .map((row) => {
      const relatedLogs = campaignLogs.filter(
        (log) => log.campaignId === row.id
      );

      return {
        ...row,
        sentCount: relatedLogs.filter((log) => log.status === "sent").length,
        failedCount: relatedLogs.filter((log) => log.status === "failed")
          .length,
      };
    });

  return paginateItems(items, input);
}

export async function getPaginatedCustomerDirectory(input: {
  page: number;
  pageSize: number;
  q: string;
  segment: string;
  sort: CustomerDirectorySort;
}) {
  const customers = await getCustomerRows();

  const filteredCustomers = customers
    .filter((row) => input.segment === "all" || row.segment === input.segment)
    .filter((row) => {
      if (!input.q) {
        return true;
      }

      const haystack = [row.name, row.email, row.segment, ...(row.tags ?? [])]
        .join(" ")
        .toLowerCase();
      return haystack.includes(input.q.toLowerCase());
    })
    .sort((left, right) => {
      if (input.sort === "churn") {
        return (
          numberValue(right.churnRiskScore) - numberValue(left.churnRiskScore)
        );
      }

      return numberValue(right.totalRevenue) - numberValue(left.totalRevenue);
    });

  return paginateItems(filteredCustomers, input);
}

export async function getTopCustomers(input: { limit: number }) {
  const customers = await getCustomerRows();

  return customers
    .sort(
      (left, right) =>
        numberValue(right.totalRevenue) - numberValue(left.totalRevenue)
    )
    .slice(0, input.limit);
}

export async function getChurnRiskCustomers(input: {
  daysSinceLastPurchase: number;
}) {
  const customers = await getCustomerRows();
  const cutoff = Date.now() - input.daysSinceLastPurchase * 24 * 60 * 60 * 1000;

  return customers
    .filter(
      (row) => !row.lastPurchaseAt || row.lastPurchaseAt.getTime() <= cutoff
    )
    .sort(
      (left, right) =>
        numberValue(right.churnRiskScore) - numberValue(left.churnRiskScore)
    )
    .slice(0, 10);
}

export async function searchCustomers(input: {
  filters: Array<{
    field: string;
    operator: "eq" | "neq" | "contains" | "gt" | "lt" | "gte" | "lte";
    value?: string | number;
  }>;
  logic: "and" | "or";
}) {
  const rows = await getCustomerRows();
  const comparisons = input.filters.map((filter) => (row: CustomerRow) => {
    const currentValue = row[filter.field as keyof CustomerRow];

    if (filter.value == null) {
      return false;
    }

    if (filter.operator === "contains") {
      const haystack = Array.isArray(currentValue)
        ? currentValue.join(" ").toLowerCase()
        : String(currentValue ?? "").toLowerCase();
      return haystack.includes(String(filter.value).toLowerCase());
    }

    if (typeof filter.value === "number") {
      const numericValue = numberValue(currentValue);

      switch (filter.operator) {
        case "eq":
          return numericValue === filter.value;
        case "neq":
          return numericValue !== filter.value;
        case "gt":
          return numericValue > filter.value;
        case "lt":
          return numericValue < filter.value;
        case "gte":
          return numericValue >= filter.value;
        case "lte":
          return numericValue <= filter.value;
        default:
          return false;
      }
    }

    const normalizedValue = String(filter.value).toLowerCase();
    const currentText = String(currentValue ?? "").toLowerCase();

    switch (filter.operator) {
      case "eq":
        return currentText === normalizedValue;
      case "neq":
        return currentText !== normalizedValue;
      default:
        return false;
    }
  });

  return rows.filter((row) =>
    input.logic === "or"
      ? comparisons.some((matcher) => matcher(row))
      : comparisons.every((matcher) => matcher(row))
  );
}

export async function getAnalyticsSummary(input: { days: number }) {
  const cutoff = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
  const transactions = (await db.execute(sql`
    select
      id,
      "product",
      "amount",
      "status",
      "createdAt"
    from "Transaction"
    where "createdAt" >= ${cutoff}
    order by "createdAt" desc
  `)) as Array<{
    amount: string | number;
    createdAt: Date;
    id: string;
    product: string;
    status: string;
  }>;

  const totalRevenue = transactions.reduce(
    (sum, row) => sum + numberValue(row.amount),
    0
  );
  const orderCount = transactions.length;
  const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

  return {
    days: input.days,
    kpis: [
      { label: "Revenue", value: totalRevenue, format: "currency" as const },
      { label: "Orders", value: orderCount, format: "number" as const },
      {
        label: "Average Order",
        value: averageOrderValue,
        format: "currency" as const,
      },
    ],
    recentOrders: transactions.slice(0, 5),
  };
}

export async function getCustomerLTV(input: { customerId: string }) {
  const [row] = (await getCustomerRows()).filter(
    (customerRow) => customerRow.id === input.customerId
  );

  return row ?? null;
}

export async function createCampaignDraft(input: {
  createdBy: string;
  message: string;
  name: string;
  recipients?: { email: string; name: string }[];
  segment: string;
  subject: string;
}) {
  const [savedCampaign] = await db
    .insert(campaign)
    .values({
      name: input.name,
      subject: input.subject,
      message: input.message,
      segment: input.segment,
      status: "draft",
      recipientCount: input.recipients?.length ?? 0,
      recipients: input.recipients ?? [],
      createdBy: input.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return savedCampaign;
}

export async function getCampaignDraftById(input: { id: string }) {
  const [row] = await db
    .select()
    .from(campaign)
    .where(eq(campaign.id, input.id))
    .limit(1);

  return row ?? null;
}

export function createCampaignLogs(input: { logs: CampaignLogInsert[] }) {
  if (input.logs.length === 0) {
    return Promise.resolve([]);
  }

  return db.insert(campaignLog).values(input.logs).returning();
}

export function createEmailLogs(input: { logs: EmailLogInsert[] }) {
  if (input.logs.length === 0) {
    return Promise.resolve([]);
  }

  return db.insert(emailLog).values(input.logs).returning();
}

export async function updateCampaignDeliveryStatus(input: {
  campaignId: string;
  status: string;
  sentAt: Date | null;
}) {
  const [updatedCampaign] = await db
    .update(campaign)
    .set({
      status: input.status,
      sentAt: input.sentAt,
      updatedAt: new Date(),
    })
    .where(eq(campaign.id, input.campaignId))
    .returning();

  return updatedCampaign ?? null;
}

export async function storeUserPreference(input: {
  userId: string;
  field: "preferredTone" | "businessType" | "customContext";
  value: string;
}) {
  const now = new Date();
  const [savedPreference] = await db
    .insert(userMemory)
    .values({
      userId: input.userId,
      [input.field]: input.value,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: userMemory.userId,
      set: {
        [input.field]: input.value,
        updatedAt: now,
      },
    })
    .returning();

  return savedPreference;
}

export async function recallUserContext(input: { userId: string }) {
  const [row] = await db
    .select()
    .from(userMemory)
    .where(eq(userMemory.userId, input.userId))
    .limit(1);

  return row ?? {};
}

export function retrieveKnowledgeContext(input: { query: string }) {
  const normalizedQuery = input.query.trim();

  if (!normalizedQuery) {
    return Promise.resolve([]);
  }

  return db
    .select({
      id: knowledgeDocument.id,
      title: knowledgeDocument.title,
      fileName: knowledgeDocument.fileName,
      text: knowledgeDocument.content,
      url: knowledgeDocument.url,
      scope: sql<"global">`'global'`,
    })
    .from(knowledgeDocument)
    .where(
      or(
        like(knowledgeDocument.title, `%${normalizedQuery}%`),
        like(knowledgeDocument.content, `%${normalizedQuery}%`)
      )
    )
    .orderBy(
      desc(knowledgeDocument.updatedAt),
      desc(knowledgeDocument.createdAt)
    )
    .limit(5);
}
