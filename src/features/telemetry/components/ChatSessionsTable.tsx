"use client";

import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { DataTable } from "@/components/data-display/DataTable/DataTable";

export interface ChatSessionRow extends Record<string, unknown> {
  chatId: string;
  title: string | null;
  actorEmail: string | null;
  model: string | null;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  startedAt: Date | null;
  lastActivityAt: Date | null;
}

interface ChatSessionsTableProps {
  data: ChatSessionRow[];
  isLoading?: boolean;
}

function formatTokenValue(value: number, fallback: number): string {
  if (value > 0) return value.toLocaleString();
  if (fallback > 0) return "—";
  return "0";
}

export function ChatSessionsTable({ data, isLoading }: ChatSessionsTableProps) {
  const columns = useMemo(() => [
    {
      key: "title",
      header: "Session",
      render: (row: ChatSessionRow) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium">{row.title || "Untitled Session"}</span>
          <span className="text-xs text-muted-foreground">{row.chatId}</span>
        </div>
      ),
    },
    {
      key: "actorEmail",
      header: "User",
      render: (row: ChatSessionRow) => (
        <span className="text-sm">{row.actorEmail || "Anonymous"}</span>
      ),
    },
    {
      key: "model",
      header: "Model",
      render: (row: ChatSessionRow) => (
        <span className="inline-flex items-center rounded-md px-2 py-1 text-[10px] font-mono font-bold bg-muted text-muted-foreground border border-border/20 uppercase tracking-tight">
          {row.model || "Unknown"}
        </span>
      ),
    },
    {
      key: "promptTokens",
      header: "Input Tokens",
      render: (row: ChatSessionRow) => (
        <span className="text-sm font-mono">
          {formatTokenValue(row.promptTokens, row.totalTokens)}
        </span>
      ),
    },
    {
      key: "completionTokens",
      header: "Output Tokens",
      render: (row: ChatSessionRow) => (
        <span className="text-sm font-mono">
          {formatTokenValue(row.completionTokens, row.totalTokens)}
        </span>
      ),
    },
    {
      key: "totalTokens",
      header: "Total Tokens",
      render: (row: ChatSessionRow) => (
        <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-mono font-medium bg-primary/10 text-primary border border-primary/20">
          {row.totalTokens.toLocaleString()}
        </span>
      ),
    },
    {
      key: "lastActivityAt",
      header: "Last Activity",
      render: (row: ChatSessionRow) => (
        <span className="text-sm text-muted-foreground">
          {row.lastActivityAt ? formatDistanceToNow(new Date(row.lastActivityAt), { addSuffix: true }) : "N/A"}
        </span>
      ),
    },
  ], []);

  return (
    <DataTable<ChatSessionRow>
      columns={columns as any}
      data={data}
      getRowId={(row) => row.chatId}
      isLoading={isLoading}
      emptyState={
        <div className="flex p-8 items-center justify-center text-muted-foreground bg-card/30 rounded-2xl border border-border/40">
          No chat sessions found.
        </div>
      }
    />
  );
}
