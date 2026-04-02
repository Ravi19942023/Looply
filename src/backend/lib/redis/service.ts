import { Redis } from "@upstash/redis";
import { env } from "@/backend/config";
import type { ICacheService } from "./cache.interface";

export class RedisCacheService implements ICacheService {
  private client: Redis | null = null;

  constructor() {
    if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
      this.client = new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      });
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      const value = await this.client.get<T>(key);
      return value ?? null;
    } catch (error) {
      console.error(`[RedisCacheService] GET failed for key: ${key}`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    try {
      if (ttlSeconds !== undefined) {
        await this.client.set(key, value, { ex: ttlSeconds });
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      console.error(`[RedisCacheService] SET failed for key: ${key}`, error);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch (error) {
      console.error(`[RedisCacheService] DELETE failed for key: ${key}`, error);
    }
  }

  async invalidate(pattern: string): Promise<void> {
    if (!this.client) return;
    const keyPattern = pattern;
    if (!keyPattern.includes("*")) {
      await this.delete(keyPattern);
      return;
    }

    const prefix = keyPattern.replace(/\*+$/, "");
    let cursor = "0";

    try {
      do {
        const [nextCursor, keys] = await this.client.scan(cursor, { match: keyPattern, count: 100 });
        cursor = nextCursor;

        const matchingKeys = keys.filter((key) => key.startsWith(prefix));

        if (matchingKeys.length > 0) {
          await this.client.del(...matchingKeys);
        }
      } while (cursor !== "0");
    } catch (error) {
      console.error(`[RedisCacheService] INVALIDATE failed for pattern: ${pattern}`, error);
    }
  }
}
