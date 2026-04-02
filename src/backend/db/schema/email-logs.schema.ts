import { pgTable, text, timestamp, uuid, varchar, jsonb } from "drizzle-orm/pg-core";

export const emailLogs = pgTable("email_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipient: varchar("recipient", { length: 255 }).notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  messageId: varchar("message_id", { length: 255 }),
  provider: varchar("provider", { length: 50 }).default("ses"),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
});

export type EmailLog = typeof emailLogs.$inferSelect;
export type NewEmailLog = typeof emailLogs.$inferInsert;
