"use client";

import { create } from "zustand";

import type { ChatSession } from "../types";

interface ChatStore {
  isPanelOpen: boolean;
  sessions: ChatSession[];
  activeSessionId: string | null;
  togglePanel: () => void;
  createSession: () => string;
  setActiveSession: (id: string) => void;
}

function createSessionRecord(): ChatSession {
  const id = crypto.randomUUID();
  return {
    id,
    title: "New chat",
  };
}

export const useChatStore = create<ChatStore>((set) => ({
  isPanelOpen: true,
  sessions: [],
  activeSessionId: null,
  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
  createSession: () => {
    const session = createSessionRecord();
    set((state) => ({
      sessions: [...state.sessions, session],
      activeSessionId: session.id,
      isPanelOpen: true,
    }));
    return session.id;
  },
  setActiveSession: (id) => set({ activeSessionId: id }),
}));

export function ensureChatSession(): string {
  const current = useChatStore.getState();

  if (current.activeSessionId) {
    return current.activeSessionId;
  }

  return current.createSession();
}
