"use client";

import { AssistantSurface } from "./AssistantSurface";

export function ChatPanel({ initialChatId }: Readonly<{ initialChatId?: string }>) {
  return <AssistantSurface initialChatId={initialChatId} />;
}
