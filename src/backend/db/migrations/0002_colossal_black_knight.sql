ALTER TABLE "document_embeddings" DROP CONSTRAINT "document_embeddings_record_id_unique";--> statement-breakpoint
ALTER TABLE "document_embeddings" ADD COLUMN "namespace" text DEFAULT 'global' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "document_embeddings_namespace_record_id_idx" ON "document_embeddings" USING btree ("namespace","record_id");