import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  lt,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { ArtifactKind } from "@/components/chat/artifact";
import type { VisibilityType } from "@/components/chat/visibility-selector";
import { ChatbotError } from "../errors";
import { buildPaginationMeta, type PaginationMeta } from "../pagination";
import { generateUUID } from "../utils";
import {
  type Chat,
  campaign,
  campaignLog,
  chat,
  customer,
  customerMetric,
  type DBMessage,
  document,
  emailLog,
  knowledgeDocument,
  message,
  product,
  type Suggestion,
  stream,
  suggestion,
  transaction,
  type User,
  user,
  userMemory,
  vote,
} from "./schema";
import { generateHashedPassword } from "./utils";

const client = postgres(process.env.POSTGRES_URL ?? "");
const db = drizzle(client);

export async function getUser(email: string): Promise<User[]> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get user by email"
    );
  }
}

export async function getUserById({
  id,
}: {
  id: string;
}): Promise<User | null> {
  try {
    const [result] = await db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);
    return result ?? null;
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to get user by id");
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    return await db.insert(user).values({ email, password: hashedPassword });
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to create user");
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    return await db.insert(user).values({ email, password }).returning({
      id: user.id,
      email: user.email,
    });
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to create guest user"
    );
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
    });
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to save chat");
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to delete chat by id"
    );
  }
}

export async function deleteAllChatsByUserId({ userId }: { userId: string }) {
  try {
    const userChats = await db
      .select({ id: chat.id })
      .from(chat)
      .where(eq(chat.userId, userId));

    if (userChats.length === 0) {
      return { deletedCount: 0 };
    }

    const chatIds = userChats.map((c) => c.id);

    await db.delete(vote).where(inArray(vote.chatId, chatIds));
    await db.delete(message).where(inArray(message.chatId, chatIds));
    await db.delete(stream).where(inArray(stream.chatId, chatIds));

    const deletedChats = await db
      .delete(chat)
      .where(eq(chat.userId, userId))
      .returning();

    return { deletedCount: deletedChats.length };
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to delete all chats by user id"
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<unknown>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id)
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Chat[] = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatbotError(
          "not_found:database",
          `Chat with id ${startingAfter} not found`
        );
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatbotError(
          "not_found:database",
          `Chat with id ${endingBefore} not found`
        );
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get chats by user id"
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    if (!selectedChat) {
      return null;
    }

    return selectedChat;
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to get chat by id");
  }
}

export async function saveMessages({ messages }: { messages: DBMessage[] }) {
  try {
    return await db.insert(message).values(messages);
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to save messages");
  }
}

export async function updateMessage({
  id,
  parts,
}: {
  id: string;
  parts: DBMessage["parts"];
}) {
  try {
    return await db.update(message).set({ parts }).where(eq(message.id, id));
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to update message");
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get messages by chat id"
    );
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === "up" })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === "up",
    });
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to vote message");
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get votes by chat id"
    );
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning();
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to save document");
  }
}

export async function updateDocumentContent({
  id,
  content,
}: {
  id: string;
  content: string;
}) {
  try {
    const docs = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt))
      .limit(1);

    const latest = docs[0];
    if (!latest) {
      throw new ChatbotError("not_found:database", "Document not found");
    }

    return await db
      .update(document)
      .set({ content })
      .where(and(eq(document.id, id), eq(document.createdAt, latest.createdAt)))
      .returning();
  } catch (_error) {
    if (_error instanceof ChatbotError) {
      throw _error;
    }
    throw new ChatbotError(
      "bad_request:database",
      "Failed to update document content"
    );
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get documents by id"
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get document by id"
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp)
        )
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to delete documents by id after timestamp"
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to save suggestions"
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(eq(suggestion.documentId, documentId));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get suggestions by document id"
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get message by id"
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp))
      );

    const messageIds = messagesToDelete.map(
      (currentMessage) => currentMessage.id
    );

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds))
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds))
        );
    }
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to delete messages by chat id after timestamp"
    );
  }
}

export async function updateChatVisibilityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "private" | "public";
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to update chat visibility by id"
    );
  }
}

export async function updateChatTitleById({
  chatId,
  title,
}: {
  chatId: string;
  title: string;
}) {
  try {
    return await db.update(chat).set({ title }).where(eq(chat.id, chatId));
  } catch (_error) {
    return;
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  try {
    const cutoffTime = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, cutoffTime),
          eq(message.role, "user")
        )
      )
      .execute();

    return stats?.count ?? 0;
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get message count by user id"
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to create stream id"
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get stream ids by chat id"
    );
  }
}

type CustomerSearchFilter = {
  field: string;
  operator: "eq" | "neq" | "contains" | "gt" | "lt" | "gte" | "lte";
  value?: string | number;
};

export async function getTopCustomers({ limit = 5 }: { limit?: number }) {
  try {
    return await db
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
        recencyScore: customerMetric.recencyScore,
        frequencyScore: customerMetric.frequencyScore,
        monetaryScore: customerMetric.monetaryScore,
      })
      .from(customer)
      .leftJoin(customerMetric, eq(customer.id, customerMetric.customerId))
      .orderBy(desc(customerMetric.totalRevenue))
      .limit(limit);
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get top customers"
    );
  }
}

export async function getChurnRiskCustomers({
  daysSinceLastPurchase = 90,
}: {
  daysSinceLastPurchase?: number;
}) {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysSinceLastPurchase);

    return await db
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
        recencyScore: customerMetric.recencyScore,
        frequencyScore: customerMetric.frequencyScore,
        monetaryScore: customerMetric.monetaryScore,
      })
      .from(customer)
      .leftJoin(customerMetric, eq(customer.id, customerMetric.customerId))
      .where(
        and(
          lt(customerMetric.lastPurchaseAt, cutoff),
          gt(customerMetric.churnRiskScore, "0")
        )
      )
      .orderBy(desc(customerMetric.churnRiskScore));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get churn risk customers"
    );
  }
}

export async function searchCustomers({
  filters = [],
  logic = "and",
}: {
  filters?: CustomerSearchFilter[];
  logic?: "and" | "or";
}) {
  try {
    const fieldMap = {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      segment: customer.segment,
      totalRevenue: customerMetric.totalRevenue,
      ltv: customerMetric.ltv,
      orderCount: customerMetric.orderCount,
      avgOrderValue: customerMetric.avgOrderValue,
      churnRiskScore: customerMetric.churnRiskScore,
      recencyScore: customerMetric.recencyScore,
      frequencyScore: customerMetric.frequencyScore,
      monetaryScore: customerMetric.monetaryScore,
    } as const;

    const clauses = filters
      .map((filter) => {
        const field = fieldMap[filter.field as keyof typeof fieldMap];
        if (!field) {
          return undefined;
        }

        switch (filter.operator) {
          case "eq":
            return eq(field, filter.value as never);
          case "neq":
            return sql`${field} <> ${filter.value as never}`;
          case "contains":
            return sql`${field}::text ilike ${`%${String(filter.value ?? "")}%`}`;
          case "gt":
            return sql`${field} > ${filter.value as never}`;
          case "lt":
            return sql`${field} < ${filter.value as never}`;
          case "gte":
            return sql`${field} >= ${filter.value as never}`;
          case "lte":
            return sql`${field} <= ${filter.value as never}`;
          default:
            return undefined;
        }
      })
      .filter((value): value is SQL<unknown> => Boolean(value));

    const whereClause =
      clauses.length === 0
        ? undefined
        : logic === "or"
          ? sql.join(clauses, sql` or `)
          : sql.join(clauses, sql` and `);

    const query = db
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
        recencyScore: customerMetric.recencyScore,
        frequencyScore: customerMetric.frequencyScore,
        monetaryScore: customerMetric.monetaryScore,
      })
      .from(customer)
      .leftJoin(customerMetric, eq(customer.id, customerMetric.customerId));

    return whereClause ? await query.where(whereClause) : await query;
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to search customers"
    );
  }
}

export async function getAnalyticsSummary({ days = 30 }: { days?: number }) {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const transactionsInWindow = await db
      .select({
        id: transaction.id,
        customerId: transaction.customerId,
        productId: transaction.productId,
        product: sql<string>`coalesce(${product.name}, ${transaction.product})`,
        productCategory: product.category,
        amount: transaction.amount,
        currency: transaction.currency,
        createdAt: transaction.createdAt,
        status: transaction.status,
      })
      .from(transaction)
      .leftJoin(product, eq(transaction.productId, product.id))
      .where(gte(transaction.createdAt, cutoff))
      .orderBy(desc(transaction.createdAt));

    const completedTransactions = transactionsInWindow.filter(
      (row) => row.status === "completed"
    );

    const revenue = completedTransactions.reduce(
      (sum, row) => sum + Number(row.amount),
      0
    );

    const topProducts = Array.from(
      completedTransactions
        .reduce<Map<string, { revenue: number; orders: number }>>(
          (acc, row) => {
            const current = acc.get(row.product) ?? { revenue: 0, orders: 0 };
            current.revenue += Number(row.amount);
            current.orders += 1;
            acc.set(row.product, current);
            return acc;
          },
          new Map()
        )
        .entries()
    )
      .map(([name, stats]) => ({
        name,
        orders: stats.orders,
        revenue: Number(stats.revenue.toFixed(2)),
      }))
      .sort((left, right) => right.revenue - left.revenue)
      .slice(0, 5);

    return {
      days,
      kpis: [
        { label: "Revenue", value: revenue, format: "currency" },
        {
          label: "Orders",
          value: completedTransactions.length,
          format: "number",
        },
        {
          label: "Customers",
          value: new Set(completedTransactions.map((row) => row.customerId))
            .size,
          format: "number",
        },
        {
          label: "Avg Order Value",
          value:
            completedTransactions.length === 0
              ? 0
              : Number((revenue / completedTransactions.length).toFixed(2)),
          format: "currency",
        },
      ],
      topProducts,
      recentOrders: transactionsInWindow.slice(0, 5),
    };
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get analytics summary"
    );
  }
}

export async function retrieveKnowledgeContext({ query }: { query: string }) {
  try {
    return await db
      .select({
        id: knowledgeDocument.id,
        title: knowledgeDocument.title,
        content: knowledgeDocument.content,
      })
      .from(knowledgeDocument)
      .where(
        sql`${knowledgeDocument.title} ilike ${`%${query}%`} or ${knowledgeDocument.content} ilike ${`%${query}%`}`
      )
      .limit(5);
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to retrieve knowledge context"
    );
  }
}

export async function createCampaignDraft({
  createdBy,
  message: campaignMessage,
  name,
  recipients,
  segment,
  subject,
}: {
  createdBy: string;
  message: string;
  name: string;
  recipients?: { email: string; name: string }[];
  segment: string;
  subject: string;
}) {
  try {
    const resolvedRecipients =
      recipients && recipients.length > 0
        ? recipients
        : ((await db
            .select({
              email: customer.email,
              name: customer.name,
            })
            .from(customer)
            .where(eq(customer.segment, segment))) as {
            email: string;
            name: string;
          }[]);

    const [createdCampaign] = await db
      .insert(campaign)
      .values({
        name,
        subject,
        message: campaignMessage,
        segment,
        status: "draft",
        recipientCount: resolvedRecipients.length,
        recipients: resolvedRecipients,
        createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return createdCampaign;
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to create campaign draft"
    );
  }
}

export async function getCampaignDraftById({ id }: { id: string }) {
  try {
    const [selectedCampaign] = await db
      .select()
      .from(campaign)
      .where(eq(campaign.id, id))
      .limit(1);

    return selectedCampaign ?? null;
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get campaign draft"
    );
  }
}

export async function markCampaignSent({ campaignId }: { campaignId: string }) {
  try {
    const [updatedCampaign] = await db
      .update(campaign)
      .set({
        status: "sent",
        sentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(campaign.id, campaignId))
      .returning();

    return updatedCampaign ?? null;
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to mark campaign sent"
    );
  }
}

export async function updateCampaignDeliveryStatus({
  campaignId,
  status,
  sentAt,
}: {
  campaignId: string;
  status: "draft" | "sent" | "partial" | "failed";
  sentAt: Date | null;
}) {
  try {
    const [updatedCampaign] = await db
      .update(campaign)
      .set({
        status,
        sentAt,
        updatedAt: new Date(),
      })
      .where(eq(campaign.id, campaignId))
      .returning();

    return updatedCampaign ?? null;
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to update campaign delivery status"
    );
  }
}

export async function createCampaignLogs({
  logs,
}: {
  logs: Array<{
    campaignId: string;
    email: string;
    status: string;
    messageId?: string | null;
    sentAt?: Date;
  }>;
}) {
  try {
    if (logs.length === 0) {
      return [];
    }

    return await db
      .insert(campaignLog)
      .values(
        logs.map((log) => ({
          campaignId: log.campaignId,
          email: log.email,
          status: log.status,
          messageId: log.messageId ?? null,
          sentAt: log.sentAt ?? new Date(),
        }))
      )
      .returning();
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to create campaign logs"
    );
  }
}

export async function createEmailLogs({
  logs,
}: {
  logs: Array<{
    recipient: string;
    subject: string;
    body: string;
    status: string;
    messageId?: string | null;
    provider: string;
    metadata?: Record<string, unknown>;
    sentAt?: Date;
  }>;
}) {
  try {
    if (logs.length === 0) {
      return [];
    }

    return await db
      .insert(emailLog)
      .values(
        logs.map((log) => ({
          recipient: log.recipient,
          subject: log.subject,
          body: log.body,
          status: log.status,
          messageId: log.messageId ?? null,
          provider: log.provider,
          metadata: log.metadata ?? {},
          sentAt: log.sentAt ?? new Date(),
        }))
      )
      .returning();
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to create email logs"
    );
  }
}

export async function storeUserPreference({
  userId,
  field,
  value,
}: {
  userId: string;
  field: "preferredTone" | "businessType" | "customContext";
  value: string;
}) {
  try {
    const [existingMemory] = await db
      .select()
      .from(userMemory)
      .where(eq(userMemory.userId, userId))
      .limit(1);

    if (!existingMemory) {
      const [createdMemory] = await db
        .insert(userMemory)
        .values({
          userId,
          preferredTone: field === "preferredTone" ? value : "professional",
          businessType: field === "businessType" ? value : null,
          customContext: field === "customContext" ? value : null,
          typicalCampaigns: [],
          reportingPrefs: {},
          updatedAt: new Date(),
        })
        .returning();

      return createdMemory;
    }

    const [updatedMemory] = await db
      .update(userMemory)
      .set({
        [field]: value,
        updatedAt: new Date(),
      })
      .where(eq(userMemory.userId, userId))
      .returning();

    return updatedMemory;
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to store user preference"
    );
  }
}

export async function recallUserContext({ userId }: { userId: string }) {
  try {
    const [memory] = await db
      .select()
      .from(userMemory)
      .where(eq(userMemory.userId, userId))
      .limit(1);

    return (
      memory ?? {
        userId,
        preferredTone: "professional",
        businessType: null,
        customContext: null,
        typicalCampaigns: [],
        reportingPrefs: {},
        updatedAt: new Date(),
      }
    );
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to recall user context"
    );
  }
}

export async function getCustomerDirectory() {
  try {
    return await db
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
        recencyScore: customerMetric.recencyScore,
        frequencyScore: customerMetric.frequencyScore,
        monetaryScore: customerMetric.monetaryScore,
        updatedAt: customerMetric.updatedAt,
      })
      .from(customer)
      .leftJoin(customerMetric, eq(customer.id, customerMetric.customerId))
      .orderBy(desc(customerMetric.totalRevenue), asc(customer.name));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get customer directory"
    );
  }
}

export async function getPaginatedCustomerDirectory(params: {
  page: number;
  pageSize: number;
  q?: string;
  segment?: string;
  sort?: "churn" | "revenue";
}): Promise<{
  items: Awaited<ReturnType<typeof getCustomerDirectory>>;
  pagination: PaginationMeta;
}> {
  try {
    const filters: SQL<unknown>[] = [];
    const normalizedQuery = params.q?.trim();

    if (normalizedQuery) {
      const searchPattern = `%${normalizedQuery}%`;
      const searchFilter = or(
        ilike(customer.name, searchPattern),
        ilike(customer.email, searchPattern),
        ilike(customer.segment, searchPattern),
        sql`${customer.tags}::text ilike ${searchPattern}`
      );

      if (searchFilter) {
        filters.push(searchFilter);
      }
    }

    if (params.segment && params.segment !== "all") {
      filters.push(eq(customer.segment, params.segment));
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    const [countResult] = await db
      .select({ count: count(customer.id) })
      .from(customer)
      .leftJoin(customerMetric, eq(customer.id, customerMetric.customerId))
      .where(whereClause);

    const pagination = buildPaginationMeta({
      page: params.page,
      pageSize: params.pageSize,
      total: countResult?.count ?? 0,
    });

    const items = await db
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
        recencyScore: customerMetric.recencyScore,
        frequencyScore: customerMetric.frequencyScore,
        monetaryScore: customerMetric.monetaryScore,
        updatedAt: customerMetric.updatedAt,
      })
      .from(customer)
      .leftJoin(customerMetric, eq(customer.id, customerMetric.customerId))
      .where(whereClause)
      .orderBy(
        params.sort === "churn"
          ? desc(customerMetric.churnRiskScore)
          : desc(customerMetric.totalRevenue),
        asc(customer.name)
      )
      .limit(pagination.pageSize)
      .offset((pagination.page - 1) * pagination.pageSize);

    return {
      items,
      pagination,
    };
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get paginated customer directory"
    );
  }
}

export async function getCampaignDirectory() {
  try {
    const campaigns = await db
      .select()
      .from(campaign)
      .orderBy(desc(campaign.createdAt));

    const campaignIds = campaigns.map((entry) => entry.id);
    const logs =
      campaignIds.length === 0
        ? []
        : await db
            .select({
              campaignId: campaignLog.campaignId,
              status: campaignLog.status,
            })
            .from(campaignLog)
            .where(inArray(campaignLog.campaignId, campaignIds));

    const logMap = logs.reduce<
      Map<string, { failedCount: number; sentCount: number }>
    >((acc, entry) => {
      const current = acc.get(entry.campaignId) ?? {
        sentCount: 0,
        failedCount: 0,
      };
      if (entry.status === "sent") {
        current.sentCount += 1;
      } else {
        current.failedCount += 1;
      }
      acc.set(entry.campaignId, current);
      return acc;
    }, new Map());

    return campaigns.map((entry) => {
      const stats = logMap.get(entry.id) ?? { sentCount: 0, failedCount: 0 };
      return {
        ...entry,
        sentCount: stats.sentCount,
        failedCount: stats.failedCount,
      };
    });
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get campaign directory"
    );
  }
}

export async function getPaginatedCampaignDirectory(params: {
  page: number;
  pageSize: number;
  q?: string;
  status?: string;
}): Promise<{
  items: Awaited<ReturnType<typeof getCampaignDirectory>>;
  pagination: PaginationMeta;
}> {
  try {
    const filters: SQL<unknown>[] = [];
    const normalizedQuery = params.q?.trim();

    if (normalizedQuery) {
      const searchPattern = `%${normalizedQuery}%`;
      const searchFilter = or(
        ilike(campaign.name, searchPattern),
        ilike(campaign.subject, searchPattern),
        ilike(campaign.segment, searchPattern)
      );

      if (searchFilter) {
        filters.push(searchFilter);
      }
    }

    if (params.status && params.status !== "all") {
      filters.push(eq(campaign.status, params.status));
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    const [countResult] = await db
      .select({ count: count(campaign.id) })
      .from(campaign)
      .where(whereClause);

    const pagination = buildPaginationMeta({
      page: params.page,
      pageSize: params.pageSize,
      total: countResult?.count ?? 0,
    });

    const campaigns = await db
      .select()
      .from(campaign)
      .where(whereClause)
      .orderBy(desc(campaign.createdAt))
      .limit(pagination.pageSize)
      .offset((pagination.page - 1) * pagination.pageSize);

    const campaignIds = campaigns.map((entry) => entry.id);
    const logs =
      campaignIds.length === 0
        ? []
        : await db
            .select({
              campaignId: campaignLog.campaignId,
              status: campaignLog.status,
            })
            .from(campaignLog)
            .where(inArray(campaignLog.campaignId, campaignIds));

    const logMap = logs.reduce<
      Map<string, { failedCount: number; sentCount: number }>
    >((acc, entry) => {
      const current = acc.get(entry.campaignId) ?? {
        sentCount: 0,
        failedCount: 0,
      };

      if (entry.status === "sent") {
        current.sentCount += 1;
      } else {
        current.failedCount += 1;
      }

      acc.set(entry.campaignId, current);
      return acc;
    }, new Map());

    return {
      items: campaigns.map((entry) => {
        const stats = logMap.get(entry.id) ?? { sentCount: 0, failedCount: 0 };
        return {
          ...entry,
          sentCount: stats.sentCount,
          failedCount: stats.failedCount,
        };
      }),
      pagination,
    };
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get paginated campaign directory"
    );
  }
}

export async function getKnowledgeBaseEntries() {
  try {
    return await db
      .select({
        id: knowledgeDocument.id,
        title: knowledgeDocument.title,
        content: knowledgeDocument.content,
        createdAt: knowledgeDocument.createdAt,
        updatedAt: knowledgeDocument.updatedAt,
      })
      .from(knowledgeDocument)
      .orderBy(desc(knowledgeDocument.updatedAt));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get knowledge base entries"
    );
  }
}

export async function getDashboardOverview() {
  try {
    const [
      [customerStats],
      [campaignStats],
      [sentCampaignStats],
      [knowledgeStats],
      [chatStats],
      [messageStats],
      [revenueStats],
      topCustomers,
      recentCampaigns,
      recentChats,
      knowledgeEntries,
    ] = await Promise.all([
      db.select({ count: count(customer.id) }).from(customer),
      db.select({ count: count(campaign.id) }).from(campaign),
      db
        .select({ count: count(campaign.id) })
        .from(campaign)
        .where(eq(campaign.status, "sent")),
      db.select({ count: count(knowledgeDocument.id) }).from(knowledgeDocument),
      db.select({ count: count(chat.id) }).from(chat),
      db.select({ count: count(message.id) }).from(message),
      db
        .select({
          total: sql<string>`coalesce(sum(case when ${transaction.status} = 'completed' then ${transaction.amount} else 0 end), 0)`,
        })
        .from(transaction),
      getTopCustomers({ limit: 5 }),
      getCampaignDirectory(),
      db
        .select({
          id: chat.id,
          title: chat.title,
          createdAt: chat.createdAt,
          visibility: chat.visibility,
        })
        .from(chat)
        .orderBy(desc(chat.createdAt))
        .limit(5),
      getKnowledgeBaseEntries(),
    ]);

    return {
      kpis: [
        {
          label: "Revenue",
          value: Number(revenueStats?.total ?? 0),
          format: "currency" as const,
        },
        {
          label: "Customers",
          value: customerStats?.count ?? 0,
          format: "number" as const,
        },
        {
          label: "Campaigns",
          value: campaignStats?.count ?? 0,
          format: "number" as const,
        },
        {
          label: "Messages",
          value: messageStats?.count ?? 0,
          format: "number" as const,
        },
      ],
      totals: {
        customerCount: customerStats?.count ?? 0,
        sentCampaignCount: sentCampaignStats?.count ?? 0,
        knowledgeCount: knowledgeStats?.count ?? 0,
        chatCount: chatStats?.count ?? 0,
      },
      topCustomers,
      recentCampaigns: recentCampaigns.slice(0, 4),
      recentChats,
      recentKnowledge: knowledgeEntries.slice(0, 4),
    };
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get dashboard overview"
    );
  }
}

export async function getTelemetryOverview({ days = 30 }: { days?: number }) {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const [
      messagesInWindow,
      chatsInWindow,
      documentsInWindow,
      campaignsInWindow,
      emailLogsInWindow,
    ] = await Promise.all([
      db
        .select({
          createdAt: message.createdAt,
          role: message.role,
        })
        .from(message)
        .where(gte(message.createdAt, cutoff))
        .orderBy(asc(message.createdAt)),
      db
        .select({
          createdAt: chat.createdAt,
        })
        .from(chat)
        .where(gte(chat.createdAt, cutoff)),
      db
        .select({
          createdAt: document.createdAt,
          kind: document.kind,
        })
        .from(document)
        .where(gte(document.createdAt, cutoff)),
      db
        .select({
          createdAt: campaign.createdAt,
          status: campaign.status,
        })
        .from(campaign)
        .where(gte(campaign.createdAt, cutoff)),
      db
        .select({
          sentAt: emailLog.sentAt,
          status: emailLog.status,
          provider: emailLog.provider,
        })
        .from(emailLog)
        .where(gte(emailLog.sentAt, cutoff)),
    ]);

    const buckets = Array.from({ length: days }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - index - 1));
      const key = date.toISOString().slice(0, 10);
      return {
        key,
        label: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        messages: 0,
        chats: 0,
        documents: 0,
        campaigns: 0,
      };
    });

    const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

    for (const entry of messagesInWindow) {
      const key = entry.createdAt.toISOString().slice(0, 10);
      const bucket = bucketMap.get(key);
      if (bucket) {
        bucket.messages += 1;
      }
    }
    for (const entry of chatsInWindow) {
      const key = entry.createdAt.toISOString().slice(0, 10);
      const bucket = bucketMap.get(key);
      if (bucket) {
        bucket.chats += 1;
      }
    }
    for (const entry of documentsInWindow) {
      const key = entry.createdAt.toISOString().slice(0, 10);
      const bucket = bucketMap.get(key);
      if (bucket) {
        bucket.documents += 1;
      }
    }
    for (const entry of campaignsInWindow) {
      const key = entry.createdAt.toISOString().slice(0, 10);
      const bucket = bucketMap.get(key);
      if (bucket) {
        bucket.campaigns += 1;
      }
    }

    const assistantMessages = messagesInWindow.filter(
      (entry) => entry.role === "assistant"
    ).length;
    const userMessages = messagesInWindow.filter(
      (entry) => entry.role === "user"
    ).length;

    return {
      days,
      totals: {
        messages: messagesInWindow.length,
        userMessages,
        assistantMessages,
        chats: chatsInWindow.length,
        documents: documentsInWindow.length,
        campaigns: campaignsInWindow.length,
        sentCampaigns: campaignsInWindow.filter(
          (entry) => entry.status === "sent"
        ).length,
        emailDeliveries: emailLogsInWindow.filter(
          (entry) => entry.status === "sent"
        ).length,
        emailFailures: emailLogsInWindow.filter(
          (entry) => entry.status !== "sent"
        ).length,
      },
      series: buckets,
    };
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get telemetry overview"
    );
  }
}

export type SystemActivityType =
  | "all"
  | "campaign"
  | "chat"
  | "document"
  | "email"
  | "knowledge"
  | "message";

type SystemActivityEntry = {
  createdAt: Date;
  description: string;
  href: string;
  id: string;
  title: string;
  type: Exclude<SystemActivityType, "all">;
};

export async function getSystemActivityFeed({
  page,
  pageSize,
  type = "all",
}: {
  page: number;
  pageSize: number;
  type?: SystemActivityType;
}): Promise<{
  items: SystemActivityEntry[];
  pagination: PaginationMeta;
}> {
  try {
    const sourceTypes: Exclude<SystemActivityType, "all">[] =
      type === "all"
        ? ["chat", "message", "document", "campaign", "email", "knowledge"]
        : [type];

    const countEntries = await Promise.all(
      sourceTypes.map(async (sourceType) => {
        switch (sourceType) {
          case "chat": {
            const [result] = await db
              .select({ count: count(chat.id) })
              .from(chat);
            return [sourceType, result?.count ?? 0] as const;
          }
          case "message": {
            const [result] = await db
              .select({ count: count(message.id) })
              .from(message)
              .innerJoin(chat, eq(message.chatId, chat.id));
            return [sourceType, result?.count ?? 0] as const;
          }
          case "document": {
            const [result] = await db
              .select({ count: count(document.id) })
              .from(document);
            return [sourceType, result?.count ?? 0] as const;
          }
          case "campaign": {
            const [result] = await db
              .select({ count: count(campaign.id) })
              .from(campaign);
            return [sourceType, result?.count ?? 0] as const;
          }
          case "knowledge": {
            const [result] = await db
              .select({ count: count(knowledgeDocument.id) })
              .from(knowledgeDocument);
            return [sourceType, result?.count ?? 0] as const;
          }
          case "email": {
            const [result] = await db
              .select({ count: count(emailLog.id) })
              .from(emailLog);
            return [sourceType, result?.count ?? 0] as const;
          }
          default: {
            return [sourceType, 0] as const;
          }
        }
      })
    );

    const total = countEntries.reduce((sum, [, current]) => sum + current, 0);
    const pagination = buildPaginationMeta({ page, pageSize, total });
    const fetchLimit = pagination.page * pagination.pageSize;
    const campaignActivityAt = sql<Date>`coalesce(${campaign.sentAt}, ${campaign.createdAt})`;

    const feeds = await Promise.all(
      sourceTypes.map(async (sourceType): Promise<SystemActivityEntry[]> => {
        switch (sourceType) {
          case "chat": {
            const recentChats = await db
              .select({
                id: chat.id,
                title: chat.title,
                createdAt: chat.createdAt,
                visibility: chat.visibility,
              })
              .from(chat)
              .orderBy(desc(chat.createdAt))
              .limit(fetchLimit);

            return recentChats.map((entry) => ({
              createdAt: entry.createdAt,
              description: `${entry.title} (${entry.visibility})`,
              href: `/assistant/${entry.id}`,
              id: `chat-${entry.id}`,
              title: "Chat created",
              type: "chat" as const,
            }));
          }
          case "message": {
            const recentMessages = await db
              .select({
                id: message.id,
                createdAt: message.createdAt,
                role: message.role,
                chatId: message.chatId,
                chatTitle: chat.title,
              })
              .from(message)
              .innerJoin(chat, eq(message.chatId, chat.id))
              .orderBy(desc(message.createdAt))
              .limit(fetchLimit);

            return recentMessages.map((entry) => ({
              createdAt: entry.createdAt,
              description: entry.chatTitle,
              href: `/assistant/${entry.chatId}`,
              id: `message-${entry.id}`,
              title:
                entry.role === "user"
                  ? "User message stored"
                  : "Assistant message stored",
              type: "message" as const,
            }));
          }
          case "document": {
            const recentDocuments = await db
              .select({
                id: document.id,
                createdAt: document.createdAt,
                title: document.title,
                kind: document.kind,
              })
              .from(document)
              .orderBy(desc(document.createdAt))
              .limit(fetchLimit);

            return recentDocuments.map((entry) => ({
              createdAt: entry.createdAt,
              description: entry.title,
              href: "/assistant",
              id: `document-${entry.id}-${entry.createdAt.toISOString()}`,
              title: `${entry.kind} artifact saved`,
              type: "document" as const,
            }));
          }
          case "campaign": {
            const recentCampaigns = await db
              .select({
                activityAt: campaignActivityAt,
                id: campaign.id,
                name: campaign.name,
                status: campaign.status,
              })
              .from(campaign)
              .orderBy(desc(campaignActivityAt))
              .limit(fetchLimit);

            return recentCampaigns.map((entry) => ({
              createdAt: entry.activityAt,
              description: entry.name,
              href: "/campaigns",
              id: `campaign-${entry.id}`,
              title:
                entry.status === "sent" ? "Campaign sent" : "Campaign drafted",
              type: "campaign" as const,
            }));
          }
          case "knowledge": {
            const recentKnowledge = await db
              .select({
                id: knowledgeDocument.id,
                title: knowledgeDocument.title,
                updatedAt: knowledgeDocument.updatedAt,
              })
              .from(knowledgeDocument)
              .orderBy(desc(knowledgeDocument.updatedAt))
              .limit(fetchLimit);

            return recentKnowledge.map((entry) => ({
              createdAt: entry.updatedAt,
              description: entry.title,
              href: "/knowledge-base",
              id: `knowledge-${entry.id}`,
              title: "Knowledge document updated",
              type: "knowledge" as const,
            }));
          }
          case "email": {
            const recentEmails = await db
              .select({
                id: emailLog.id,
                recipient: emailLog.recipient,
                subject: emailLog.subject,
                status: emailLog.status,
                provider: emailLog.provider,
                sentAt: emailLog.sentAt,
              })
              .from(emailLog)
              .orderBy(desc(emailLog.sentAt))
              .limit(fetchLimit);

            return recentEmails.map((entry) => ({
              createdAt: entry.sentAt,
              description: `${entry.subject} -> ${entry.recipient} (${entry.provider})`,
              href: "/campaigns",
              id: `email-${entry.id}`,
              title:
                entry.status === "sent"
                  ? "Email delivered"
                  : "Email delivery failed",
              type: "email" as const,
            }));
          }
          default: {
            return [];
          }
        }
      })
    );

    const items = feeds
      .flat()
      .sort(
        (left, right) => right.createdAt.getTime() - left.createdAt.getTime()
      )
      .slice(
        (pagination.page - 1) * pagination.pageSize,
        pagination.page * pagination.pageSize
      );

    return {
      items,
      pagination,
    };
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get system activity feed"
    );
  }
}
