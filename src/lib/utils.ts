import type { UIMessagePart } from "ai";
import { type ClassValue, clsx } from "clsx";
import { formatISO } from "date-fns";
import { twMerge } from "tailwind-merge";

import type { ChatMessage, CustomUIDataTypes } from "@/lib/types";
import type { DBMessage, Document } from "@/lib/db/schema";
import { ChatbotError, type ErrorCode } from "./errors";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function fetcher(url: string) {
  const response = await fetch(url, {
    credentials: "include",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { code?: string; cause?: string } | null;
    throw new ChatbotError((payload?.code as ErrorCode | undefined) ?? "bad_request:api", payload?.cause);
  }

  return response.json();
}

export async function fetchWithErrorHandlers(input: RequestInfo | URL, init?: RequestInit) {
  try {
    const response = await fetch(input, {
      credentials: "include",
      ...init,
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { code?: string; cause?: string } | null;
      throw new ChatbotError((payload?.code as ErrorCode | undefined) ?? "bad_request:api", payload?.cause);
    }

    return response;
  } catch (error) {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      throw new ChatbotError("offline:chat");
    }

    throw error;
  }
}

export function generateUUID(): string {
  return crypto.randomUUID();
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function ensureUuid(value: string) {
  return isUuid(value) ? value : generateUUID();
}

export function sanitizeText(text: string) {
  return text.replace("<has_function_call>", "");
}

export function convertToUIMessages(messages: DBMessage[]): ChatMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role as "system" | "user" | "assistant",
    metadata: {
      createdAt: formatISO(message.createdAt),
    },
    parts: message.parts as UIMessagePart<CustomUIDataTypes, Record<string, never>>[],
    attachments: (message as any).attachments ?? [],
    annotations: (message as any).annotations ?? [],
  }));
}

export function getTextFromMessage(message: ChatMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

export function getDocumentTimestampByIndex(documents: Document[], index: number) {
  return documents[index]?.createdAt ?? new Date();
}
