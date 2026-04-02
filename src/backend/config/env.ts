import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { z } from "zod";

function loadEnvFile(): void {
  const envPath = resolve(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    return;
  }

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

loadEnvFile();

const optionalString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().optional(),
);

const optionalUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().url().optional(),
);

const envSchema = z
  .object({
    POSTGRES_URL: z.string().url(),
    AI_GATEWAY_API_KEY: optionalString,
    AI_CHAT_MODEL: z.string().default("openai/gpt-4.1-mini"),
    AI_CHAT_MAX_STEPS: z.coerce.number().int().min(1).max(20).default(10),
    AI_SUMMARY_MODEL: z.string().default("gpt-4.1-nano"),
    AI_EMBEDDING_MODEL: z.string().default("openai/text-embedding-3-small"),
    BLOB_READ_WRITE_TOKEN: optionalString,
    EMAIL_PROVIDER: z.enum(["ses", "sendgrid", "resend"]).default("ses"),
    EMAIL_FROM: z.string().email(),
    AWS_ACCESS_KEY_ID: optionalString,
    AWS_SECRET_ACCESS_KEY: optionalString,
    AWS_REGION: z.string().default("us-east-1"),
    SENDGRID_API_KEY: optionalString,
    AUTH_SECRET: z.string().min(32),
    JWT_EXPIRY: z.string().default("1d"),
    UPSTASH_REDIS_REST_URL: optionalUrl,
    UPSTASH_REDIS_REST_TOKEN: optionalString,
    APP_URL: z.string().url(),
    CRON_SECRET: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z.string().min(16).optional(),
    ),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  });

export type Env = z.infer<typeof envSchema>;

export function parseEnv(input: NodeJS.ProcessEnv): Env {
  return envSchema.parse(input);
}

export const env = parseEnv(process.env);
