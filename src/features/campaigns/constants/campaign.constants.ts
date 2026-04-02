export const CAMPAIGN_STATUS_TABS = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Sent", value: "sent" },
  { label: "Failed", value: "failed" },
] as const;

export const DEFAULT_CAMPAIGN_FORM = {
  name: "",
  subject: "",
  message: "",
  segment: "general",
  scheduledAt: null,
  aiEnhanced: false,
} as const;
