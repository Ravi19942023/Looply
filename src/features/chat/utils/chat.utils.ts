import type { UIMessage } from "ai";
import type { SendCampaignOutput, SendCampaignSuccess } from "../types/chat.types";
 
 /**
  * Type guard for the 'sendCampaign' tool result output.
  */
export function isSendCampaignOutput(value: unknown): value is SendCampaignOutput {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return v["requiresApproval"] === true && typeof v["campaign"] === "object";
}

/**
 * Type guard for the 'sendCampaign' tool success result.
 */
export function isSendCampaignSuccess(value: unknown): value is SendCampaignSuccess {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return v["success"] === true && typeof v["campaign"] === "object";
}

/**
 * Extracts and concatenates text from a message's parts.
 */
export function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}
