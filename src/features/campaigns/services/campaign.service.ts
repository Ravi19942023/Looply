import { API_ENDPOINTS } from "@/shared/constants";
import { apiClient } from "@/lib/api";

import type { CampaignFormState, CampaignRecord } from "../types";

export async function fetchCampaigns(status?: string): Promise<CampaignRecord[]> {
  const query = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  return apiClient<CampaignRecord[]>(`${API_ENDPOINTS.CAMPAIGNS}${query}`);
}

export async function createCampaign(input: CampaignFormState): Promise<CampaignRecord> {
  return apiClient<CampaignRecord>(API_ENDPOINTS.CAMPAIGNS, {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      subject: input.subject,
      message: input.message,
      segment: input.segment,
      scheduledAt: input.scheduledAt ?? null,
    }),
  });
}

export async function sendCampaign(id: string): Promise<CampaignRecord> {
  return apiClient<CampaignRecord>(`${API_ENDPOINTS.CAMPAIGNS}/${id}/send`, {
    method: "POST",
    body: JSON.stringify({ sendNow: true }),
  });
}
