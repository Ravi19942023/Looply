import { tool } from "ai";
import { z } from "zod";

import type { MemoryService } from "@/backend/modules/memory";

export function buildMemoryTools(memoryService: MemoryService, actorId: string) {
  return {
    storeUserPreference: tool({
      description:
        "Save a learned user preference or business context. Call this when the user explicitly states a preference (tone, report format, business type, operational preference). This persists across sessions.",
      inputSchema: z.object({
        field: z
          .enum(["preferredTone", "businessType", "customContext"])
          .describe("The preference field to update"),
        value: z.string().min(1).describe("The preference value to store"),
      }),
      execute: async ({ field, value }) => {
        await memoryService.updateLongTermMemory(actorId, field, value);
        return { success: true, field, value };
      },
    }),

    recallUserContext: tool({
      description:
        "Retrieve the stored user preferences and business context. Use this to customize your responses based on known user preferences, or when the user asks about their saved settings.",
      inputSchema: z.object({}),
      execute: async () => {
        const memory = await memoryService.getMemory(actorId);

        if (!memory) {
          return { message: "No stored preferences found for this user." };
        }

        return {
          preferredTone: memory.preferredTone,
          businessType: memory.businessType,
          typicalCampaigns: memory.typicalCampaigns,
          customContext: memory.customContext,
        };
      },
    }),
  };
}
