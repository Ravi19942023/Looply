import {
  createCampaignDraft as createCampaignDraftRecord,
  createCampaignLogs,
  getAnalyticsSummary as getAnalyticsSummaryRecord,
  getCampaignDraftById,
  getChurnRiskCustomers as getChurnRiskCustomersRecord,
  getTopCustomers as getTopCustomersRecord,
  recallUserContext as recallUserContextRecord,
  retrieveKnowledgeContext as retrieveKnowledgeContextRecord,
  searchCustomers as searchCustomersRecord,
  storeUserPreference as storeUserPreferenceRecord,
  updateCampaignDeliveryStatus,
} from "@/lib/db/queries";
import { EmailService } from "@/lib/email/email.service";
import { createEmailAdapter } from "@/lib/email/email-adapter.factory";

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

  const emailService = new EmailService(createEmailAdapter());
  const delivery = await emailService.send(
    {
      to: (campaign.recipients ?? []).map((recipient) => recipient.email),
      subject: campaign.subject,
      html: campaign.message,
    },
    { campaignId: campaign.id }
  );

  const deliveredCount = delivery.results.filter(
    (result) => result.success
  ).length;
  const failedCount = delivery.results.length - deliveredCount;
  const status =
    deliveredCount === 0 ? "failed" : failedCount === 0 ? "sent" : "partial";

  await createCampaignLogs({
    logs: delivery.results.map((result) => ({
      campaignId: campaign.id,
      email: result.recipient,
      status: result.success ? "sent" : "failed",
      messageId: result.messageId ?? null,
      sentAt: new Date(),
    })),
  });

  const updatedCampaign = await updateCampaignDeliveryStatus({
    campaignId,
    status,
    sentAt: deliveredCount > 0 ? new Date() : null,
  });

  return {
    success: deliveredCount > 0,
    campaign: updatedCampaign ?? campaign,
    provider: delivery.provider,
    deliveredCount,
    failedCount,
    logs: delivery.results,
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
