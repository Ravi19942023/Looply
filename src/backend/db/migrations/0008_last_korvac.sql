ALTER TABLE "chats" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "telemetry_logs" ADD COLUMN "model" text;