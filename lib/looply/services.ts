import {
  createCampaignDraft as createCampaignDraftRecord,
  createCampaignLogs,
  getAnalyticsSummary as getAnalyticsSummaryRecord,
  getCampaignDraftById,
  getChurnRiskCustomers as getChurnRiskCustomersRecord,
  getTopCustomers as getTopCustomersRecord,
  markCampaignSent,
  recallUserContext as recallUserContextRecord,
  retrieveKnowledgeContext as retrieveKnowledgeContextRecord,
  searchCustomers as searchCustomersRecord,
  storeUserPreference as storeUserPreferenceRecord,
} from "@/lib/db/queries";

export function getTopCustomers(limit = 5) {
  return getTopCustomersRecord({ limit });
}

export function getChurnRiskCustomers(daysSinceLastPurchase = 90) {
  return getChurnRiskCustomersRecord({ daysSinceLastPurchase });
}

export function searchCustomers(
  filters: Array<{
    field: string;
    operator: "eq" | "neq" | "contains" | "gt" | "lt" | "gte" | "lte";
    value?: string | number;
  }> = [],
  logic: "and" | "or" = "and"
) {
  return searchCustomersRecord({ filters, logic });
}

export function getAnalyticsSummary(days = 30) {
  return getAnalyticsSummaryRecord({ days });
}

export function retrieveKnowledgeContext(query: string) {
  return retrieveKnowledgeContextRecord({ query });
}

export function createCampaignDraft(input: {
  createdBy: string;
  message: string;
  name: string;
  recipients?: { email: string; name: string }[];
  segment: string;
  subject: string;
}) {
  return createCampaignDraftRecord(input);
}

export async function sendCampaignDraft(campaignId: string, confirm: boolean) {
  const campaign = await getCampaignDraftById({ id: campaignId });
  if (!campaign) {
    return {
      error: "Campaign not found.",
    };
  }

  if (!confirm) {
    return {
      requiresApproval: true as const,
      campaign,
    };
  }

  const sent = await markCampaignSent({ campaignId });
  if (!sent) {
    return {
      error: "Campaign not found.",
    };
  }

  await createCampaignLogs({
    campaignId,
    recipients: sent.recipients ?? [],
  });

  return {
    success: true as const,
    campaign: sent,
  };
}

export function storePreference(
  userId: string,
  input: {
    field: "preferredTone" | "businessType" | "customContext";
    value: string;
  }
) {
  return storeUserPreferenceRecord({
    userId,
    field: input.field,
    value: input.value,
  });
}

export function recallPreference(userId: string) {
  return recallUserContextRecord({ userId });
}
