import { createClient } from "redis";

import { isProductionEnvironment } from "@/lib/constants";
import { ChatbotError } from "@/lib/errors";

const DEFAULT_MAX_MESSAGES = 10;
const TTL_SECONDS = 60 * 60;

let client: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (!client && process.env.REDIS_URL) {
    client = createClient({ url: process.env.REDIS_URL });
    client.on("error", () => undefined);
    client.connect().catch(() => {
      client = null;
    });
  }
  return client;
}

/**
 * Rate-limit by a composite key of userId + IP.
 * Falls back to IP-only when no userId is available.
 */
export async function checkRateLimit({
  ip,
  userId,
  maxMessages = DEFAULT_MAX_MESSAGES,
}: {
  ip: string | undefined;
  userId?: string | null;
  maxMessages?: number;
}) {
  if (!isProductionEnvironment || !ip) {
    return;
  }

  const redis = getClient();
  if (!redis?.isReady) {
    return;
  }

  const scope = userId ? `user:${userId}` : `ip:${ip}`;
  const key = `rate-limit:chat:${scope}`;

  try {
    const [count] = await redis
      .multi()
      .incr(key)
      .expire(key, TTL_SECONDS, "NX")
      .exec();

    if (typeof count === "number" && count > maxMessages) {
      throw new ChatbotError("rate_limit:chat");
    }
  } catch (error) {
    if (error instanceof ChatbotError) {
      throw error;
    }
  }
}
