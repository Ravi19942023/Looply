import { tool } from "ai";
import { z } from "zod";
import type { AuthSession } from "@/lib/auth/types";
import { recallPreference } from "@/lib/looply/services";

export const recallUserContext = ({ session }: { session: AuthSession }) =>
  tool({
    description: "Retrieve stored user preferences and business context.",
    inputSchema: z.object({}),
    execute: async () => recallPreference(session.user.id),
  });
