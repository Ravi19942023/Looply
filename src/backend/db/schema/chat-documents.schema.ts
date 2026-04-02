import { integer, pgTable, text, timestamp, uuid, varchar, index } from "drizzle-orm/pg-core";

import { chats } from "./chat-persistence.schema";
import { users } from "./users.schema";

export const chatDocuments = pgTable("chat_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  chatId: uuid("chat_id")
    .notNull()
    .references(() => chats.id),
  actorId: uuid("actor_id")
    .notNull()
    .references(() => users.id),
  key: text("key").notNull().unique(),
  url: text("url").notNull(),
  fileName: varchar("file_name", { length: 500 }).notNull(),
  fileSize: integer("file_size").notNull(),
  chunkCount: integer("chunk_count").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  chatIdIdx: index("chat_documents_chat_id_idx").on(table.chatId),
  actorIdIdx: index("chat_documents_actor_id_idx").on(table.actorId),
}));

export type ChatDocument = typeof chatDocuments.$inferSelect;
export type NewChatDocument = typeof chatDocuments.$inferInsert;
