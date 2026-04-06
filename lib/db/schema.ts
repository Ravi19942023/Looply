import { type InferSelectModel, sql } from "drizzle-orm";
import {
  boolean,
  customType,
  foreignKey,
  integer,
  json,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const vector = customType<{
  data: number[];
  driverData: string;
  config: { dimensions: number };
}>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 1536})`;
  },
  toDriver(value) {
    return `[${value.join(",")}]`;
  },
  fromDriver(value) {
    const normalized = value.replace(/^\[|\]$/g, "");
    if (!normalized) {
      return [];
    }
    return normalized.split(",").map((part) => Number(part.trim()));
  },
});

export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
  name: text("name"),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  isAnonymous: boolean("isAnonymous").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  title: text("title").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  visibility: varchar("visibility", { enum: ["public", "private"] })
    .notNull()
    .default("private"),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable("Message_v2", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  parts: json("parts").notNull(),
  attachments: json("attachments").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

export const vote = pgTable(
  "Vote_v2",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.chatId, table.messageId] }),
  })
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  "Document",
  {
    id: uuid("id").notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    kind: varchar("text", { enum: ["text", "code", "image", "sheet"] })
      .notNull()
      .default("text"),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id, table.createdAt] }),
  })
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  "Suggestion",
  {
    id: uuid("id").notNull().defaultRandom(),
    documentId: uuid("documentId").notNull(),
    documentCreatedAt: timestamp("documentCreatedAt").notNull(),
    originalText: text("originalText").notNull(),
    suggestedText: text("suggestedText").notNull(),
    description: text("description"),
    isResolved: boolean("isResolved").notNull().default(false),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      name: "suggestion_document_ref_fk",
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  })
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  "Stream",
  {
    id: uuid("id").notNull().defaultRandom(),
    chatId: uuid("chatId").notNull(),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  })
);

export type Stream = InferSelectModel<typeof stream>;

export const customer = pgTable("Customer", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  segment: varchar("segment", { length: 100 }).notNull().default("general"),
  tags: json("tags").$type<string[]>().notNull().default([]),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type Customer = InferSelectModel<typeof customer>;

export const customerMetric = pgTable("CustomerMetric", {
  customerId: uuid("customerId")
    .primaryKey()
    .notNull()
    .references(() => customer.id),
  totalRevenue: numeric("totalRevenue", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  ltv: numeric("ltv", { precision: 12, scale: 2 }).notNull().default("0"),
  orderCount: integer("orderCount").notNull().default(0),
  avgOrderValue: numeric("avgOrderValue", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  lastPurchaseAt: timestamp("lastPurchaseAt"),
  churnRiskScore: numeric("churnRiskScore", { precision: 4, scale: 2 })
    .notNull()
    .default("0"),
  recencyScore: numeric("recencyScore", { precision: 4, scale: 2 })
    .notNull()
    .default("0"),
  frequencyScore: numeric("frequencyScore", { precision: 4, scale: 2 })
    .notNull()
    .default("0"),
  monetaryScore: numeric("monetaryScore", { precision: 4, scale: 2 })
    .notNull()
    .default("0"),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type CustomerMetric = InferSelectModel<typeof customerMetric>;

export const product = pgTable("Product", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type Product = InferSelectModel<typeof product>;

export const transaction = pgTable("Transaction", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  customerId: uuid("customerId")
    .notNull()
    .references(() => customer.id),
  productId: uuid("productId").references(() => product.id),
  product: varchar("product", { length: 255 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  status: varchar("status", { length: 50 }).notNull().default("completed"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type Transaction = InferSelectModel<typeof transaction>;

export const campaign = pgTable("Campaign", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  message: text("message").notNull(),
  segment: varchar("segment", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("draft"),
  recipientCount: integer("recipientCount").notNull().default(0),
  recipients: json("recipients")
    .$type<Array<{ email: string; name: string }>>()
    .notNull()
    .default([]),
  createdBy: uuid("createdBy")
    .notNull()
    .references(() => user.id),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type Campaign = InferSelectModel<typeof campaign>;

export const campaignLog = pgTable("CampaignLog", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  campaignId: uuid("campaignId")
    .notNull()
    .references(() => campaign.id),
  email: varchar("email", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  messageId: varchar("messageId", { length: 255 }),
  sentAt: timestamp("sentAt").notNull().defaultNow(),
});

export type CampaignLog = InferSelectModel<typeof campaignLog>;

export const emailLog = pgTable("EmailLog", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  recipient: varchar("recipient", { length: 255 }).notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  messageId: varchar("messageId", { length: 255 }),
  provider: varchar("provider", { length: 50 }).notNull().default("ses"),
  metadata: json("metadata")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  sentAt: timestamp("sentAt").notNull().defaultNow(),
});

export type EmailLog = InferSelectModel<typeof emailLog>;

export const userMemory = pgTable("UserMemory", {
  userId: uuid("userId")
    .primaryKey()
    .notNull()
    .references(() => user.id),
  preferredTone: varchar("preferredTone", { length: 50 }).default(
    "professional"
  ),
  businessType: varchar("businessType", { length: 100 }),
  customContext: text("customContext"),
  typicalCampaigns: json("typicalCampaigns")
    .$type<string[]>()
    .notNull()
    .default([]),
  reportingPrefs: json("reportingPrefs")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type UserMemory = InferSelectModel<typeof userMemory>;

export const knowledgeDocument = pgTable("KnowledgeDocument", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  source: varchar("source", { length: 20 }).notNull().default("curated"),
  key: text("key"),
  url: text("url"),
  fileName: varchar("fileName", { length: 500 }),
  fileSize: integer("fileSize"),
  contentType: varchar("contentType", { length: 255 }),
  chunkCount: integer("chunkCount"),
  inContext: boolean("inContext").notNull().default(true),
  createdBy: uuid("createdBy")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type KnowledgeDocument = InferSelectModel<typeof knowledgeDocument>;

export const chatDocument = pgTable("ChatDocument", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  key: text("key").notNull(),
  url: text("url").notNull(),
  fileName: varchar("fileName", { length: 500 }).notNull(),
  fileSize: integer("fileSize").notNull(),
  contentType: varchar("contentType", { length: 255 }).notNull(),
  content: text("content").notNull(),
  chunkCount: integer("chunkCount").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type ChatDocument = InferSelectModel<typeof chatDocument>;

export const documentEmbedding = pgTable(
  "DocumentEmbedding",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    namespace: text("namespace").notNull().default("global"),
    recordId: text("recordId").notNull(),
    scope: varchar("scope", { length: 20 }).notNull().default("global"),
    actorId: uuid("actorId")
      .notNull()
      .references(() => user.id),
    chatId: uuid("chatId").references(() => chat.id),
    knowledgeDocumentId: uuid("knowledgeDocumentId").references(
      () => knowledgeDocument.id
    ),
    chatDocumentId: uuid("chatDocumentId").references(() => chatDocument.id),
    fileName: varchar("fileName", { length: 500 }).notNull(),
    text: text("text").notNull(),
    chunkIndex: integer("chunkIndex").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    metadata: json("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::json`),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    namespaceRecordIdx: uniqueIndex(
      "document_embeddings_namespace_record_idx"
    ).on(table.namespace, table.recordId),
  })
);

export type DocumentEmbedding = InferSelectModel<typeof documentEmbedding>;

export const ragTelemetryLog = pgTable("RagTelemetryLog", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  actorId: uuid("actorId").references(() => user.id),
  chatId: uuid("chatId").references(() => chat.id),
  source: text("source").notNull(),
  model: text("model"),
  promptTokens: integer("promptTokens").notNull().default(0),
  completionTokens: integer("completionTokens").notNull().default(0),
  totalTokens: integer("totalTokens").notNull().default(0),
  metadata: json("metadata")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::json`),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type RagTelemetryLog = InferSelectModel<typeof ragTelemetryLog>;
