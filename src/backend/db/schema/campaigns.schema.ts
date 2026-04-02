import { sql } from "drizzle-orm";
import { index, uuid, varchar, text, timestamp, pgTable, integer, jsonb } from "drizzle-orm/pg-core";

import { users } from "./users.schema";

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    subject: varchar("subject", { length: 500 }).notNull(),
    message: text("message").notNull(),
    segment: varchar("segment", { length: 100 }).notNull(),
    status: varchar("status", { length: 50 }).notNull().default("draft"),
    recipientCount: integer("recipient_count").default(0),
    recipients: jsonb("recipients").$type<{ name: string; email: string }[]>().default(sql`'[]'::jsonb`),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    statusIdx: index("campaigns_status_idx").on(table.status),
  }),
);

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
