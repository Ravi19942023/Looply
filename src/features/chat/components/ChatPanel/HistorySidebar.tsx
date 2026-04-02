"use client";

import { isToday, isYesterday, subMonths, subWeeks } from "date-fns";
import { Loader2, MessageSquarePlus, PanelLeftClose, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import type { Chat } from "@/lib/db/schema";

function groupChats(chats: Chat[]) {
  const now = new Date();
  const weekAgo = subWeeks(now, 1);
  const monthAgo = subMonths(now, 1);

  return chats.reduce(
    (groups, chat) => {
      const createdAt = new Date(chat.createdAt);

      if (isToday(createdAt)) {
        groups.today.push(chat);
      } else if (isYesterday(createdAt)) {
        groups.yesterday.push(chat);
      } else if (createdAt > weekAgo) {
        groups.lastWeek.push(chat);
      } else if (createdAt > monthAgo) {
        groups.lastMonth.push(chat);
      } else {
        groups.older.push(chat);
      }

      return groups;
    },
    {
      today: [] as Chat[],
      yesterday: [] as Chat[],
      lastWeek: [] as Chat[],
      lastMonth: [] as Chat[],
      older: [] as Chat[],
    },
  );
}

export function HistorySidebar({
  activeChatId,
  chats,
  deletingChatIds,
  isDeletingAll,
  isLoading,
  isOpen,
  onDeleteAll,
  onDeleteChat,
  onNewChat,
  onToggle,
}: Readonly<{
  activeChatId: string | null;
  chats: Chat[];
  deletingChatIds: Set<string>;
  isDeletingAll: boolean;
  isLoading: boolean;
  isOpen: boolean;
  onDeleteAll: () => void;
  onDeleteChat: (chatId: string) => void;
  onNewChat: () => void;
  onToggle: () => void;
}>) {
  const router = useRouter();

  if (!isOpen) {
    return (
      <aside className="hidden border-r border-border/60 bg-sidebar px-3 py-4 lg:flex lg:w-[72px] lg:flex-col lg:items-center lg:gap-3">
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex size-10 items-center justify-center rounded-2xl border border-border/60 bg-background text-foreground transition hover:bg-muted"
          aria-label="Open history"
        >
          <PanelLeftClose className="size-4" />
        </button>
        <button
          type="button"
          onClick={onNewChat}
          className="inline-flex size-10 items-center justify-center rounded-2xl border border-border/60 bg-background text-foreground transition hover:bg-muted"
          aria-label="New chat"
        >
          <MessageSquarePlus className="size-4" />
        </button>
      </aside>
    );
  }

  const grouped = groupChats(chats);
  const sections = [
    ["Today", grouped.today],
    ["Yesterday", grouped.yesterday],
    ["Last 7 days", grouped.lastWeek],
    ["Last 30 days", grouped.lastMonth],
    ["Older", grouped.older],
  ] as const;

  return (
    <aside className="hidden w-[280px] shrink-0 border-r border-border/10 bg-sidebar/30 backdrop-blur-sm lg:flex lg:flex-col">
      <div className="flex h-[73px] items-center gap-2 px-4 border-b border-border/10">
        <button
          type="button"
          onClick={onNewChat}
          className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-xl bg-foreground px-3 text-sm font-bold tracking-tight text-background transition hover:opacity-90 active:scale-[0.98]"
        >
          <MessageSquarePlus className="size-4" />
          New chat
        </button>
        <button
          type="button"
          onClick={onDeleteAll}
          disabled={isDeletingAll}
          className="inline-flex size-9 items-center justify-center rounded-xl border border-border/40 bg-background/50 text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Delete all chats"
        >
          {isDeletingAll ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        </button>
      </div>


      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {isLoading ? (
          <div className="space-y-2 px-1 py-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-10 animate-pulse rounded-xl bg-background/50" />
            ))}
          </div>
        ) : null}

        {!isLoading && chats.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/40 bg-background/50 px-4 py-8 text-center text-xs font-medium text-muted-foreground">
            No conversation history.
          </div>
        ) : null}

        {!isLoading &&
          sections.map(([label, items]) =>
            items.length > 0 ? (
              <section key={label} className="mb-6">
                <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                  {label}
                </p>
                <div className="space-y-1">
                  {items.map((chat) => {
                    const isActive = chat.id === activeChatId;
                    return (
                      <div key={chat.id} className="group flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => router.push(`/assistant/${chat.id}` as any)}
                          className={cn(
                            "flex-1 rounded-xl px-3 py-2 text-left text-sm transition-all truncate",
                            isActive
                              ? "bg-foreground/5 text-foreground font-bold"
                              : "text-muted-foreground/80 hover:bg-foreground/5 hover:text-foreground"
                          )}
                        >
                          <p className="truncate">{chat.title}</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteChat(chat.id)}
                          disabled={deletingChatIds.has(chat.id)}
                          className={cn(
                            "inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground/30 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 disabled:opacity-100 disabled:cursor-not-allowed",
                            deletingChatIds.has(chat.id) ? "opacity-100 text-destructive bg-destructive/10" : "opacity-0"
                          )}
                          aria-label={`Delete ${chat.title}`}
                        >
                          {deletingChatIds.has(chat.id) ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null,
          )}
      </div>
    </aside>

  );
}
