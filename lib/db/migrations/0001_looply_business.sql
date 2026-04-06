CREATE TABLE IF NOT EXISTS "Customer" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(255) NOT NULL,
  "email" varchar(255) NOT NULL,
  "phone" varchar(32),
  "segment" varchar(100) NOT NULL DEFAULT 'general',
  "tags" json NOT NULL DEFAULT '[]',
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "CustomerMetric" (
  "customerId" uuid PRIMARY KEY NOT NULL REFERENCES "Customer"("id"),
  "totalRevenue" numeric(12, 2) NOT NULL DEFAULT 0,
  "ltv" numeric(12, 2) NOT NULL DEFAULT 0,
  "orderCount" integer NOT NULL DEFAULT 0,
  "avgOrderValue" numeric(12, 2) NOT NULL DEFAULT 0,
  "lastPurchaseAt" timestamp,
  "churnRiskScore" integer NOT NULL DEFAULT 0,
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Transaction" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "customerId" uuid NOT NULL REFERENCES "Customer"("id"),
  "product" varchar(255) NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "status" varchar(50) NOT NULL DEFAULT 'completed',
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Campaign" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(255) NOT NULL,
  "subject" varchar(500) NOT NULL,
  "message" text NOT NULL,
  "segment" varchar(100) NOT NULL,
  "status" varchar(50) NOT NULL DEFAULT 'draft',
  "recipientCount" integer NOT NULL DEFAULT 0,
  "recipients" json NOT NULL DEFAULT '[]',
  "createdBy" uuid NOT NULL REFERENCES "User"("id"),
  "sentAt" timestamp,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "CampaignLog" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "campaignId" uuid NOT NULL REFERENCES "Campaign"("id"),
  "email" varchar(255) NOT NULL,
  "status" varchar(50) NOT NULL,
  "messageId" varchar(255),
  "sentAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "UserMemory" (
  "userId" uuid PRIMARY KEY NOT NULL REFERENCES "User"("id"),
  "preferredTone" varchar(50) DEFAULT 'professional',
  "businessType" varchar(100),
  "customContext" text,
  "typicalCampaigns" json NOT NULL DEFAULT '[]',
  "reportingPrefs" json NOT NULL DEFAULT '{}',
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "KnowledgeDocument" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" varchar(255) NOT NULL,
  "content" text NOT NULL,
  "createdBy" uuid NOT NULL REFERENCES "User"("id"),
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);
