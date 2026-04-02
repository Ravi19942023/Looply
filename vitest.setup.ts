import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env");

if (existsSync(envPath)) {
  const raw = readFileSync(envPath, "utf8");

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^"|"$/g, "");

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

process.env.DATABASE_URL ??= "https://example.com/db";
process.env.DATABASE_URL_DIRECT ??= "https://example.com/db-direct";
process.env.DB_PROVIDER ??= "postgres";
process.env.APP_RUNTIME ??= "node";
process.env.JOB_MODE ??= "inprocess";
process.env.AI_PROVIDER ??= "openai";
process.env.OPENAI_API_KEY ??= "sk-test";
process.env.EMAIL_PROVIDER ??= "ses";
process.env.EMAIL_FROM ??= "hello@looply.ai";
process.env.STORAGE_PROVIDER ??= "s3";
process.env.S3_BUCKET ??= "looply";
process.env.JWT_SECRET ??= "12345678901234567890123456789012";
process.env.JWT_EXPIRY ??= "1d";
process.env.UPSTASH_REDIS_REST_URL ??= "https://example.upstash.io";
process.env.UPSTASH_REDIS_REST_TOKEN ??= "token";
process.env.APP_URL ??= "http://localhost:3000";

if (!process.env.NODE_ENV) {
  Reflect.set(process.env, "NODE_ENV", "test");
}
