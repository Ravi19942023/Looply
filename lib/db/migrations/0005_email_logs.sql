CREATE TABLE IF NOT EXISTS "EmailLog" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "recipient" varchar(255) NOT NULL,
  "subject" text NOT NULL,
  "body" text NOT NULL,
  "status" varchar(50) NOT NULL,
  "messageId" varchar(255),
  "provider" varchar(50) NOT NULL DEFAULT 'ses',
  "metadata" json NOT NULL DEFAULT '{}'::json,
  "sentAt" timestamp NOT NULL DEFAULT now()
);
