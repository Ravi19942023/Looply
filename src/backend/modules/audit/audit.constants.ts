export const AUDIT_EVENTS = {
  CUSTOMER_LIST_VIEWED: "customer.list.viewed",
  CUSTOMER_CREATED: "customer.created",
  CAMPAIGN_CREATED: "campaign.created",
  CAMPAIGN_SENT: "campaign.sent",
  AI_TOOL_CALL: "ai.tool_call",
  DOCUMENT_UPLOADED: "document.uploaded",
  DOCUMENT_DELETED: "document.deleted",
  DOCUMENT_CONTEXT_UPDATED: "document.context.updated",
  RAG_CONTEXT_RETRIEVED: "rag.context.retrieved",
  CHAT_RESPONSE_GENERATED: "chat.response.generated",
  LOGIN_SUCCEEDED: "auth.login.succeeded",
  METRICS_RECOMPUTED: "analytics.metrics.recomputed",
} as const;

export type AuditEvent = (typeof AUDIT_EVENTS)[keyof typeof AUDIT_EVENTS];
