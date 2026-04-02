"use client";

import { useMemo, useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

import { API_ENDPOINTS } from "@/shared/constants";
import { CHAT_CHARACTER_LIMIT } from "../constants";

import type { ChatMessage } from "../types";

const THROTTLE_MS = 50;

function extractText(message: ChatMessage): string {
  return message.parts
    .flatMap((part) => {
      if (part.type === "text") {
        return [part.text];
      }

      return [];
    })
    .join("");
}

export function useChatStream(sessionId: string) {
  const [input, setInput] = useState("");

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: API_ENDPOINTS.CHAT,
        credentials: "include",
        prepareSendMessagesRequest: ({ messages }) => ({
          body: {
            sessionId,
            messages: messages
              .filter((msg) => msg.role === "user" || msg.role === "assistant")
              .map((msg) => ({
                role: msg.role,
                content: extractText(msg as ChatMessage),
              })),
          },
        }),
      }),
    [sessionId],
  );

  const chat = useChat<ChatMessage>({
    id: sessionId,
    transport,
    experimental_throttle: THROTTLE_MS,
    onError: (error) => {
      console.error("[Chat] Stream error:", error.message);
    },
  });

  const isLoading = chat.status === "submitted" || chat.status === "streaming";
  const canSend = !isLoading && sessionId !== "pending-session";

  const sendMessage = useCallback(
    (messageText: string) => {
      if (!messageText.trim() || !canSend) return;
      if (messageText.length > CHAT_CHARACTER_LIMIT) return;

      setInput("");
      chat.sendMessage({ text: messageText.trim() });
    },
    [canSend, chat],
  );

  return {
    messages: chat.messages,
    input,
    setInput,
    sendMessage,
    stop: chat.stop,
    regenerate: chat.regenerate,
    isLoading,
    status: chat.status,
    error: chat.error?.message ?? null,
  };
}
