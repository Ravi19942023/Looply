import type { Campaign, CampaignDetails, CampaignLogEntry, CreateCampaignInput } from "./campaign.types";

export interface ICampaignRepository {
  findAll(status?: string): Promise<Campaign[]>;
  findById(id: string): Promise<CampaignDetails | null>;
  create(input: CreateCampaignInput & { createdBy: string; recipientCount: number; status: Campaign["status"] }): Promise<Campaign>;
  updateStatus(id: string, status: Campaign["status"], sentAt?: Date | null): Promise<Campaign | null>;
  createLogs(entries: Array<Omit<CampaignLogEntry, "id" | "sentAt"> & { sentAt?: Date }>): Promise<void>;
}
