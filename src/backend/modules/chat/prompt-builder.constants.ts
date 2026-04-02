export const TOOL_DESCRIPTIONS = [
  {
    name: "retrieveKnowledgeContext",
    displayName: "Searching knowledge base",
    purpose: "Search uploaded knowledge-base documents for relevant context",
    whenToUse: "User asks about uploaded docs, policies, procedures, or any content from the knowledge base",
  },
  {
    name: "getTopCustomers",
    displayName: "Fetching top customers",
    purpose: "Retrieve the highest-value customers by revenue",
    whenToUse: "Revenue analysis, VIP identification, top customer queries",
  },
  {
    name: "getChurnRiskCustomers",
    displayName: "Re-engaging inactive customers",
    purpose: "Identify customers at risk of churn based on inactivity thresholds",
    whenToUse: "Retention planning, re-engagement, finding inactive users",
  },
  {
    name: "searchCustomers",
    displayName: "Searching customer directory",
    purpose: "Advanced multi-field search (name, email, revenue, LTV, last purchase, etc.)",
    whenToUse: "Complex customer queries, conditional filtering, or multi-criteria identification",
  },
  {
    name: "getCustomerLTV",
    displayName: "Analyzing customer value",
    purpose: "Look up lifetime value and full metrics for a specific customer",
    whenToUse: "Customer-specific LTV queries, individual customer analysis, value lookups",
  },
  {
    name: "listCampaigns",
    displayName: "Browsing campaign history",
    purpose: "List campaigns, optionally filtered by status",
    whenToUse: "Campaign overview, status checks, filtering campaigns",
  },
  {
    name: "getCampaignById",
    displayName: "Fetching campaign details",
    purpose: "Fetch a campaign and its delivery logs by ID",
    whenToUse: "Deep-dive on a specific campaign, delivery log analysis",
  },
  {
    name: "createCampaign",
    displayName: "Drafting your marketing campaign",
    purpose: "Create a draft email campaign for a customer segment",
    whenToUse: "User wants to set up or draft a new marketing campaign — always confirm before sending",
  },
  {
    name: "sendCampaign",
    displayName: "Confirming campaign details",
    purpose: "Prepare a campaign for sending — shows approval card in chat UI",
    whenToUse: "User explicitly confirms they want to send a draft campaign",
  },
  {
    name: "getAnalyticsSummary",
    displayName: "Analyzing performance data",
    purpose: "Retrieve analytics KPIs and revenue summaries for a period",
    whenToUse: "Performance review, trend analysis, dashboard queries",
  },
  {
    name: "storeUserPreference",
    displayName: "Remembering your preferences",
    purpose: "Save a learned user preference or business context",
    whenToUse: "User mentions tone, report format, business type, or operational preferences",
  },
  {
    name: "recallUserContext",
    displayName: "Personalizing your experience",
    purpose: "Retrieve stored user preferences and business context",
    whenToUse: "When you need to customize output based on known user preferences",
  },
] as const;

export const PROMPT_VERSION = "1.0";
