export interface Campaign {
  id: string;
  name: string;
  subject: string;
  message: string;
  segment: string;
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  recipientCount: number | null;
  recipients: { name: string; email: string }[] | null;
  scheduledAt: Date | null;
  sentAt: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCampaignInput {
  name: string;
  subject: string;
  message: string;
  segment: string;
  recipients?: { name: string; email: string }[];
  scheduledAt?: string | null;
}

export interface CampaignLogEntry {
  id: string;
  campaignId: string;
  email: string;
  status: string;
  messageId: string | null;
  sentAt: Date;
}

export interface CampaignDetails extends Campaign {
  logs: CampaignLogEntry[];
}
