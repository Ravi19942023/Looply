import { sql } from "drizzle-orm";
import { uuid, varchar, text, timestamp, pgTable, jsonb, index } from "drizzle-orm/pg-core";

import { users } from "./users.schema";

export const userMemory = pgTable("user_memory", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id),
  preferredTone: varchar("preferred_tone", { length: 50 }).default("professional"),
  businessType: varchar("business_type", { length: 100 }),
  typicalCampaigns: jsonb("typical_campaigns")
    .$type<string[]>()
    .default(sql`'[]'::jsonb`)
    .notNull(),
  reportingPrefs: jsonb("reporting_prefs")
    .$type<Record<string, unknown>>()
    .default(sql`'{}'::jsonb`)
    .notNull(),
  customContext: text("custom_context"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const conversationMessages = pgTable("conversation_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: varchar("session_id", { length: 100 }).notNull(),
  role: varchar("role", { length: 20 }).notNull(),
  content: text("content").notNull(),
  parts: jsonb("parts").$type<unknown[]>().default(sql`'[]'::jsonb`).notNull(),
  attachments: jsonb("attachments")
    .$type<Array<{ name: string; url: string; contentType: string }>>()
    .default(sql`'[]'::jsonb`)
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  sessionIdIdx: index("conversation_messages_session_id_idx").on(table.sessionId),
}));

export type UserMemory = typeof userMemory.$inferSelect;
export type NewUserMemory = typeof userMemory.$inferInsert;
export type ConversationMessage = typeof conversationMessages.$inferSelect;
export type NewConversationMessage = typeof conversationMessages.$inferInsert;
