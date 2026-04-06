import type { InferUITool, UIMessage } from "ai";
import { z } from "zod";
import type { ArtifactKind } from "@/components/chat/artifact";
import type { createCampaign } from "./ai/tools/create-campaign";
import type { createDocument } from "./ai/tools/create-document";
import type { getAnalyticsSummaryTool } from "./ai/tools/get-analytics-summary";
import type { getChurnRiskCustomersTool } from "./ai/tools/get-churn-risk-customers";
import type { getTopCustomersTool } from "./ai/tools/get-top-customers";
import type { getWeather } from "./ai/tools/get-weather";
import type { recallUserContext } from "./ai/tools/recall-user-context";
import type { requestSuggestions } from "./ai/tools/request-suggestions";
import type { retrieveKnowledgeContextTool } from "./ai/tools/retrieve-knowledge-context";
import type { searchCustomersTool } from "./ai/tools/search-customers";
import type { sendCampaign } from "./ai/tools/send-campaign";
import type { storeUserPreference } from "./ai/tools/store-user-preference";
import type { updateDocument } from "./ai/tools/update-document";
import type { Suggestion } from "./db/schema";

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

type weatherTool = InferUITool<typeof getWeather>;
type topCustomersTool = InferUITool<typeof getTopCustomersTool>;
type churnRiskCustomersTool = InferUITool<typeof getChurnRiskCustomersTool>;
type searchCustomersUiTool = InferUITool<typeof searchCustomersTool>;
type analyticsSummaryTool = InferUITool<typeof getAnalyticsSummaryTool>;
type retrieveKnowledgeContextUiTool = InferUITool<
  ReturnType<typeof retrieveKnowledgeContextTool>
>;
type createDocumentTool = InferUITool<ReturnType<typeof createDocument>>;
type updateDocumentTool = InferUITool<ReturnType<typeof updateDocument>>;
type requestSuggestionsTool = InferUITool<
  ReturnType<typeof requestSuggestions>
>;
type createCampaignTool = InferUITool<ReturnType<typeof createCampaign>>;
type sendCampaignTool = InferUITool<ReturnType<typeof sendCampaign>>;
type storeUserPreferenceTool = InferUITool<
  ReturnType<typeof storeUserPreference>
>;
type recallUserContextTool = InferUITool<ReturnType<typeof recallUserContext>>;

export type ChatTools = {
  getWeather: weatherTool;
  getTopCustomers: topCustomersTool;
  getChurnRiskCustomers: churnRiskCustomersTool;
  searchCustomers: searchCustomersUiTool;
  getAnalyticsSummary: analyticsSummaryTool;
  retrieveKnowledgeContext: retrieveKnowledgeContextUiTool;
  createDocument: createDocumentTool;
  updateDocument: updateDocumentTool;
  requestSuggestions: requestSuggestionsTool;
  createCampaign: createCampaignTool;
  sendCampaign: sendCampaignTool;
  storeUserPreference: storeUserPreferenceTool;
  recallUserContext: recallUserContextTool;
};

export type CustomUIDataTypes = {
  textDelta: string;
  imageDelta: string;
  sheetDelta: string;
  codeDelta: string;
  suggestion: Suggestion;
  appendMessage: string;
  id: string;
  title: string;
  kind: ArtifactKind;
  clear: null;
  finish: null;
  "chat-title": string;
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export type Attachment = {
  id?: string;
  name: string;
  url: string;
  contentType: string;
  kind?: "image" | "session-document";
};
