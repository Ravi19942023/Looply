import { sql } from "drizzle-orm";
import { customType, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

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

export const documentEmbeddings = pgTable("document_embeddings", {
  id: uuid("id").defaultRandom().primaryKey(),
  namespace: text("namespace").notNull().default("global"),
  recordId: text("record_id").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }).notNull(),
  metadata: jsonb("metadata")
    .$type<Record<string, unknown>>()
    .default(sql`'{}'::jsonb`)
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}, (table) => ({
  namespaceRecordIdIdx: uniqueIndex("document_embeddings_namespace_record_id_idx").on(
    table.namespace,
    table.recordId,
  ),
}));

export type DocumentEmbedding = typeof documentEmbeddings.$inferSelect;
export type NewDocumentEmbedding = typeof documentEmbeddings.$inferInsert;
