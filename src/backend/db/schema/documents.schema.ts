import { uuid, text, varchar, timestamp, pgTable, integer, boolean, index } from "drizzle-orm/pg-core";

import { users } from "./users.schema";

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id")
    .notNull()
    .references(() => users.id),
  key: text("key").notNull().unique(),
  url: text("url").notNull(),
  fileName: varchar("file_name", { length: 500 }).notNull(),
  fileSize: integer("file_size").notNull(),
  chunkCount: integer("chunk_count").notNull(),
  inContext: boolean("in_context").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  actorIdIdx: index("documents_actor_id_idx").on(table.actorId),
}));

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
