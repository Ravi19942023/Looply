export interface CampaignRecord {
  id: string;
  name: string;
  subject: string;
  message: string;
  segment: string;
  status: string;
  recipientCount: number | null;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface CampaignFormState {
  name: string;
  subject: string;
  message: string;
  segment: string;
  scheduledAt?: string | null;
  aiEnhanced: boolean;
}
