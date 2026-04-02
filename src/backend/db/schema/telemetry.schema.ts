import { pgTable, text, timestamp, uuid, integer, index } from "drizzle-orm/pg-core";

import { chats } from "./chat-persistence.schema";
import { users } from "./users.schema";

export const telemetryLogs = pgTable("telemetry_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id").references(() => users.id),
  chatId: uuid("chat_id").references(() => chats.id),
  source: text("source").notNull(),
  model: text("model"),
  promptTokens: integer("prompt_tokens").notNull().default(0),
  completionTokens: integer("completion_tokens").notNull().default(0),
  totalTokens: integer("total_tokens").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  actorIdIdx: index("telemetry_logs_actor_id_idx").on(table.actorId),
  chatIdIdx: index("telemetry_logs_chat_id_idx").on(table.chatId),
}));

export type TelemetryLog = typeof telemetryLogs.$inferSelect;
export type NewTelemetryLog = typeof telemetryLogs.$inferInsert;
