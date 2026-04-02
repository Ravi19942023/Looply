import { pgTable, text, timestamp, uuid, integer, jsonb, index } from "drizzle-orm/pg-core";
import { chats } from "./chat-persistence.schema";

export const toolLogs = pgTable("tool_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  chatId: uuid("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
  toolName: text("tool_name").notNull(),
  input: jsonb("input").notNull(),
  output: jsonb("output"),
  stepIndex: integer("step_index").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  chatIdIdx: index("tool_logs_chat_id_idx").on(table.chatId),
}));

export type ToolLog = typeof toolLogs.$inferSelect;
export type NewToolLog = typeof toolLogs.$inferInsert;
