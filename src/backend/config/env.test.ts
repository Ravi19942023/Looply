import { describe, expect, it } from "vitest";

import { parseEnv } from "./env";

const baseEnv = {
  POSTGRES_URL: "https://example.com/db",
  AI_GATEWAY_API_KEY: "test-gateway-key",
  BLOB_READ_WRITE_TOKEN: "blob-token",
  EMAIL_PROVIDER: "ses",
  EMAIL_FROM: "hello@looply.ai",
  AUTH_SECRET: "12345678901234567890123456789012",
  JWT_EXPIRY: "1d",
  UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "token",
  APP_URL: "http://localhost:3000",
  NODE_ENV: "test",
} as const;

describe("parseEnv", () => {
  it("accepts the Vercel-native environment contract", () => {
    const env = parseEnv(baseEnv);
    expect(env.POSTGRES_URL).toBe("https://example.com/db");
    expect(env.AUTH_SECRET).toHaveLength(32);
    expect(env.EMAIL_PROVIDER).toBe("ses");
  });

  it("rejects short auth secrets", () => {
    expect(() => parseEnv({ ...baseEnv, AUTH_SECRET: "too-short" })).toThrow();
  });

  it("treats blank optional provider env vars as unset", () => {
    const env = parseEnv({
      ...baseEnv,
      AI_GATEWAY_API_KEY: "",
      BLOB_READ_WRITE_TOKEN: "",
      UPSTASH_REDIS_REST_URL: "",
      UPSTASH_REDIS_REST_TOKEN: "",
    });

    expect(env.AI_GATEWAY_API_KEY).toBeUndefined();
    expect(env.BLOB_READ_WRITE_TOKEN).toBeUndefined();
    expect(env.UPSTASH_REDIS_REST_URL).toBeUndefined();
    expect(env.UPSTASH_REDIS_REST_TOKEN).toBeUndefined();
  });

  it("rejects missing postgres connection strings", () => {
    const invalidEnv = { ...baseEnv };
    delete (invalidEnv as Record<string, unknown>).POSTGRES_URL;

    expect(() => parseEnv(invalidEnv)).toThrow();
  });
});
