import type { UserRole } from "@/lib/auth/types";

type Entitlements = {
  maxMessagesPerHour: number;
};

const DEFAULT_MAX_MESSAGES_PER_HOUR = 10;

function getMaxMessagesPerHour() {
  const rawValue = process.env.CHAT_MAX_MESSAGES_PER_HOUR;
  const parsedValue = rawValue ? Number.parseInt(rawValue, 10) : Number.NaN;

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return DEFAULT_MAX_MESSAGES_PER_HOUR;
  }

  return parsedValue;
}

export const entitlementsByUserType: Record<UserRole, Entitlements> = {
  admin: {
    maxMessagesPerHour: getMaxMessagesPerHour(),
  },
  manager: {
    maxMessagesPerHour: getMaxMessagesPerHour(),
  },
  viewer: {
    maxMessagesPerHour: getMaxMessagesPerHour(),
  },
};
