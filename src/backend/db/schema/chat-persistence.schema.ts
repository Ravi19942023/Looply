import { sql } from "drizzle-orm";
import { boolean, jsonb, pgTable, text, timestamp, uuid, varchar, index } from "drizzle-orm/pg-core";

import { users } from "./users.schema";

export const chats = pgTable("chats", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  actorIdIdx: index("chats_actor_id_idx").on(table.actorId),
}));

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  chatId: uuid("chat_id")
    .notNull()
    .references(() => chats.id),
  role: varchar("role", { length: 20 }).notNull(),
  parts: jsonb("parts").$type<unknown[]>().notNull(),
  attachments: jsonb("attachments")
    .$type<Array<{ name: string; url: string; contentType: string }>>()
    .default(sql`'[]'::jsonb`)
    .notNull(),
  annotations: jsonb("annotations").$type<any[]>().default(sql`'[]'::jsonb`).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  chatIdIdx: index("chat_messages_chat_id_idx").on(table.chatId),
}));

export const chatStreams = pgTable("chat_streams", {
  id: uuid("id").defaultRandom().primaryKey(),
  chatId: uuid("chat_id")
    .notNull()
    .references(() => chats.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  chatIdIdx: index("chat_streams_chat_id_idx").on(table.chatId),
}));

export const chatArtifacts = pgTable("chat_artifacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  chatId: uuid("chat_id")
    .notNull()
    .references(() => chats.id),
  actorId: uuid("actor_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  kind: varchar("kind", { length: 20 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}, (table) => ({
  chatIdIdx: index("chat_artifacts_chat_id_idx").on(table.chatId),
  actorIdIdx: index("chat_artifacts_actor_id_idx").on(table.actorId),
}));

export const chatArtifactVersions = pgTable("chat_artifact_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  artifactId: uuid("artifact_id")
    .notNull()
    .references(() => chatArtifacts.id),
  content: text("content"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  artifactIdIdx: index("chat_artifact_versions_artifact_id_idx").on(table.artifactId),
}));

export const chatArtifactSuggestions = pgTable("chat_artifact_suggestions", {
  id: uuid("id").defaultRandom().primaryKey(),
  artifactId: uuid("artifact_id")
    .notNull()
    .references(() => chatArtifacts.id),
  originalText: text("original_text").notNull(),
  suggestedText: text("suggested_text").notNull(),
  description: text("description"),
  isResolved: boolean("is_resolved").default(false).notNull(),
  actorId: uuid("actor_id")
    .notNull()
    .references(() => users.id),
  documentCreatedAt: timestamp("document_created_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  artifactIdIdx: index("chat_artifact_suggestions_artifact_id_idx").on(table.artifactId),
  actorIdIdx: index("chat_artifact_suggestions_actor_id_idx").on(table.actorId),
}));

export type ChatRecord = typeof chats.$inferSelect;
export type NewChatRecord = typeof chats.$inferInsert;
export type ChatMessageRecord = typeof chatMessages.$inferSelect;
export type NewChatMessageRecord = typeof chatMessages.$inferInsert;
export type ChatStreamRecord = typeof chatStreams.$inferSelect;
export type ChatArtifactRecord = typeof chatArtifacts.$inferSelect;
export type ChatArtifactVersionRecord = typeof chatArtifactVersions.$inferSelect;
export type ChatArtifactSuggestionRecord = typeof chatArtifactSuggestions.$inferSelect;
