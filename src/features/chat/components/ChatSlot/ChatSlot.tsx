"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/feedback";

const ChatPanel = dynamic(
  () => import("../ChatPanel").then((module) => module.ChatPanel),
  {
    ssr: false,
    loading: () => <Skeleton height="100%" width="100%" />,
  },
);

export function ChatSlot() {
  return <ChatPanel />;
}
