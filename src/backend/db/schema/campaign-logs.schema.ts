import { index, uuid, varchar, timestamp, pgTable } from "drizzle-orm/pg-core";

import { campaigns } from "./campaigns.schema";

export const campaignLogs = pgTable(
  "campaign_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    status: varchar("status", { length: 50 }).notNull(),
    messageId: varchar("message_id", { length: 255 }),
    sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    campaignIdx: index("cl_campaign_idx").on(table.campaignId),
  }),
);

export type CampaignLog = typeof campaignLogs.$inferSelect;
export type NewCampaignLog = typeof campaignLogs.$inferInsert;
