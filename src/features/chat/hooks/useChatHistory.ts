"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { toast } from "sonner";

import type { Chat } from "@/lib/db/schema";
import { fetcher } from "@/lib/utils";

type ChatHistoryResponse = {
  chats: Chat[];
  hasMore: boolean;
};

export function useChatHistory() {
  const { mutate } = useSWRConfig();
  const [deletingChatIds, setDeletingChatIds] = useState<Set<string>>(new Set());
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const { data, isLoading } = useSWR<ChatHistoryResponse>("/api/v1/history?limit=50", fetcher, {
    revalidateOnFocus: false,
  });

  const deleteChat = async (id: string) => {
    if (deletingChatIds.has(id)) return;

    setDeletingChatIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    try {
      const response = await fetch(`/api/v1/chat?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete chat");
      }

      toast.success("Chat deleted");
      await mutate("/api/v1/history?limit=50");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete chat");
    } finally {
      setDeletingChatIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const deleteAll = async () => {
    if (isDeletingAll) return;
    setIsDeletingAll(true);

    try {
      const response = await fetch("/api/v1/history", {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete all chats");
      }

      toast.success("All chats deleted");
      await mutate("/api/v1/history?limit=50");
    } catch (error) {
      console.error("Delete all error:", error);
      toast.error("Failed to delete all chats");
    } finally {
      setIsDeletingAll(false);
    }
  };

  return {
    chats: data?.chats ?? [],
    hasMore: data?.hasMore ?? false,
    isLoading,
    isDeletingAll,
    deletingChatIds,
    deleteChat,
    deleteAll,
  };
}
