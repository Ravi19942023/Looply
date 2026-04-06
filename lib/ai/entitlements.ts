import type { UserType } from "@/app/(auth)/auth";

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

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  regular: {
    maxMessagesPerHour: getMaxMessagesPerHour(),
  },
};
