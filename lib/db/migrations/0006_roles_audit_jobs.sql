ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "role" varchar(20) NOT NULL DEFAULT 'manager';

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "actorId" uuid REFERENCES "User"("id"),
  "event" varchar(100) NOT NULL,
  "resourceType" varchar(50) NOT NULL,
  "resourceId" uuid,
  "metadata" json NOT NULL DEFAULT '{}'::json,
  "ipAddress" varchar(64),
  "userAgent" text,
  "timestamp" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "JobRun" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "jobName" varchar(100) NOT NULL,
  "status" varchar(20) NOT NULL,
  "processedCount" integer NOT NULL DEFAULT 0,
  "retryCount" integer NOT NULL DEFAULT 0,
  "error" text,
  "startedAt" timestamp NOT NULL DEFAULT now(),
  "finishedAt" timestamp
);
