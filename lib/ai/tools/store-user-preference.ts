import { tool } from "ai";
import { z } from "zod";
import type { AuthSession } from "@/lib/auth/types";
import { storePreference } from "@/lib/looply/services";

export const storeUserPreference = ({ session }: { session: AuthSession }) =>
  tool({
    description:
      "Save a user preference or business context for future personalization.",
    inputSchema: z.object({
      field: z.enum(["preferredTone", "businessType", "customContext"]),
      value: z.string().min(1),
    }),
    execute: async ({ field, value }) =>
      storePreference(session.user.id, { field, value }),
  });
