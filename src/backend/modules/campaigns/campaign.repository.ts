import { desc, eq } from "drizzle-orm";

import { db } from "@/backend/db";
import { campaignLogs, campaigns } from "@/backend/db/schema";

import type { ICampaignRepository } from "./campaign.repository.interface";
import type { Campaign, CampaignDetails, CampaignLogEntry, CreateCampaignInput } from "./campaign.types";

export class CampaignRepository implements ICampaignRepository {
  async findAll(status?: string): Promise<Campaign[]> {
    return db.query.campaigns.findMany({
      where: status ? eq(campaigns.status, status) : undefined,
      orderBy: desc(campaigns.createdAt),
    }) as Promise<Campaign[]>;
  }

  async findById(id: string): Promise<CampaignDetails | null> {
    const campaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, id),
    });

    if (!campaign) {
      return null;
    }

    const logs = await db.query.campaignLogs.findMany({
      where: eq(campaignLogs.campaignId, id),
      orderBy: desc(campaignLogs.sentAt),
    });

    return {
      ...(campaign as Campaign),
      logs: logs as CampaignLogEntry[],
    };
  }

  async create(
    input: CreateCampaignInput & { createdBy: string; recipientCount: number; status: Campaign["status"] },
  ): Promise<Campaign> {
    const [campaign] = await db
      .insert(campaigns)
      .values({
        ...input,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      })
      .returning();

    return campaign as Campaign;
  }

  async updateStatus(id: string, status: Campaign["status"], sentAt?: Date | null): Promise<Campaign | null> {
    const [campaign] = await db
      .update(campaigns)
      .set({
        status,
        sentAt: sentAt ?? null,
      })
      .where(eq(campaigns.id, id))
      .returning();

    return (campaign as Campaign | undefined) ?? null;
  }

  async createLogs(
    entries: Array<Omit<CampaignLogEntry, "id" | "sentAt"> & { sentAt?: Date }>,
  ): Promise<void> {
    if (entries.length === 0) {
      return;
    }

    await db.insert(campaignLogs).values(
      entries.map((entry) => ({
        campaignId: entry.campaignId,
        email: entry.email,
        status: entry.status,
        messageId: entry.messageId,
        sentAt: entry.sentAt ?? new Date(),
      })),
    );
  }
}
