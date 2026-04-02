import { tool } from "ai";
import { z } from "zod";

import type { CampaignService } from "@/backend/modules/campaigns";

export function buildCampaignTools(campaignService: CampaignService, actorId: string) {
  return {
    listCampaigns: tool({
      description:
        "List all marketing campaigns, optionally filtered by status (draft, active, paused, completed). Returns campaign names, status, dates, and delivery metrics. Use for campaign overviews and status checks.",
      inputSchema: z.object({
        status: z.string().optional().describe("Filter campaigns by status (draft, active, paused, completed)"),
      }),
      execute: async ({ status }) => campaignService.list(status),
    }),
    getCampaignById: tool({
      description:
        "Fetch a single campaign by ID, including its full delivery logs and performance metrics. Use for deep-dive analysis on a specific campaign.",
      inputSchema: z.object({
        id: z.string().min(1).describe("The campaign ID to retrieve"),
      }),
      execute: async ({ id }) => campaignService.getById(id),
    }),
    createCampaign: tool({
      description:
        "Create a new draft email campaign targeting a customer segment. The campaign starts in 'draft' status. After creating, always present the campaign details to the user and ask if they want to send it before calling sendCampaign.",
      inputSchema: z.object({
        name: z.string().min(1).describe("Campaign name"),
        subject: z.string().min(1).describe("Email subject line"),
        message: z.string().min(1).describe("Email body content (HTML supported)"),
        segment: z.string().min(1).describe("Target customer segment (e.g. 'general', 'vip', 'at-risk')"),
        recipients: z.array(z.object({ name: z.string(), email: z.string() })).optional().describe("Optional explicit list of recipients (name and email) to target"),
      }),
      execute: async (input) => campaignService.create(input, actorId),
    }),
    sendCampaign: tool({
      description:
        "Trigger a campaign send. Requires a campaign ID. If 'confirm' is true, the campaign is dispatched immediately (use when the user says 'Yes' or 'Directly send'). If 'confirm' is false (default), it returns the campaign details for user approval via a card in the UI.",
      inputSchema: z.object({
        campaignId: z.string().uuid().describe("The campaign ID to retrieve/send"),
        confirm: z.boolean().optional().default(false).describe("Whether to immediately dispatch without UI approval"),
      }),
      execute: async ({ campaignId, confirm }) => {
        const campaign = await campaignService.getById(campaignId);

        if (!campaign) {
          throw new Error("Campaign not found");
        }

        if (confirm) {
          const sent = await campaignService.send(campaignId, actorId);
          return {
            success: true,
            campaign: {
              id: sent.id,
              name: sent.name,
              subject: sent.subject,
              segment: sent.segment,
              recipientCount: sent.recipientCount,
              status: sent.status,
            },
          };
        }

        return {
          requiresApproval: true,
          campaign: {
            id: campaign.id,
            name: campaign.name,
            subject: campaign.subject,
            segment: campaign.segment,
            recipientCount: campaign.recipientCount,
            recipients: campaign.recipients,
            status: campaign.status,
          },
        };
      },
    }),
  };
}
