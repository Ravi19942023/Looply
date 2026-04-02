import { env } from "@/backend/config";

export const CONTEXT_WINDOW = {
  MAX_TOKENS: 6_144,
  SUMMARY_BUDGET_TOKENS: 400,
  CHARS_PER_TOKEN: 3.5,
  SUMMARY_MODEL: env.AI_SUMMARY_MODEL,
} as const;
