import { TOOL_DESCRIPTIONS } from "./prompt-builder.constants";
import type { ChatMessage } from "@/lib/types";

export function getMessageText(
  message:
    | {
      parts: Array<{
        type: string;
        text?: string;
      }>;
    }
    | undefined,
) {
  if (!message) {
    return "";
  }

  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("")
    .trim();
}

export function buildChatTitle(message: ChatMessage) {
  const text = getMessageText(message);
  if (!text) {
    return "New chat";
  }

  return text.length > 60 ? `${text.slice(0, 57).trim()}...` : text;
}

export function getToolDisplayName(name: string): string {
  const tool = TOOL_DESCRIPTIONS.find((t) => t.name === name);
  return tool?.displayName ?? name;
}
