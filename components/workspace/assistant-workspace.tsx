"use client";

import { ChatShell } from "@/components/chat/shell";
import { ActiveChatProvider } from "@/hooks/use-active-chat";

export function AssistantWorkspace() {
  return (
    <ActiveChatProvider>
      <ChatShell />
    </ActiveChatProvider>
  );
}
