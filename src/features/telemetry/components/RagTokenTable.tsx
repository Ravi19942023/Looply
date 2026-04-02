"use client";

import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { DataTable } from "@/components/data-display/DataTable/DataTable";

export interface RagTokenRow extends Record<string, unknown> {
  id: string;
  source: string;
  model: string | null;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  createdAt: Date | null;
  actorEmail: string | null;
  chatTitle: string | null;
}

interface RagTokenTableProps {
  data: RagTokenRow[];
  isLoading?: boolean;
}

const SOURCE_LABELS: Record<string, string> = {
  "rag:embed": "Query Embedding",
  "rag:embedTexts": "Document Embedding",
  "rag:summarize": "Summarization",
};

function getSourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source;
}

function formatTokenValue(value: number, fallback: number): string {
  if (value > 0) return value.toLocaleString();
  if (fallback > 0) return "—";
  return "0";
}

export function RagTokenTable({ data, isLoading }: RagTokenTableProps) {
  const columns = useMemo(() => [
    {
      key: "source",
      header: "Operation",
      render: (row: RagTokenRow) => (
        <span className="inline-flex items-center rounded-md px-2 py-1 text-[10px] font-mono font-bold bg-muted text-muted-foreground border border-border/20 uppercase tracking-tight">
          {getSourceLabel(row.source)}
        </span>
      ),
    },
    {
      key: "model",
      header: "Model",
      render: (row: RagTokenRow) => (
        <span className="inline-flex items-center rounded-md px-2 py-1 text-[10px] font-mono font-bold bg-muted text-muted-foreground border border-border/20 uppercase tracking-tight">
          {row.model || "Unknown"}
        </span>
      ),
    },
    {
      key: "context",
      header: "Context",
      render: (row: RagTokenRow) => (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">{row.chatTitle || "System"}</span>
          <span className="text-xs text-muted-foreground">{row.actorEmail || "System"}</span>
        </div>
      ),
    },
    {
      key: "promptTokens",
      header: "Input Tokens",
      render: (row: RagTokenRow) => (
        <span className="text-sm font-mono">
          {formatTokenValue(row.promptTokens, row.totalTokens)}
        </span>
      ),
    },
    {
      key: "completionTokens",
      header: "Output Tokens",
      render: (row: RagTokenRow) => (
        <span className="text-sm font-mono">
          {formatTokenValue(row.completionTokens, row.totalTokens)}
        </span>
      ),
    },
    {
      key: "totalTokens",
      header: "Total Tokens",
      render: (row: RagTokenRow) => (
        <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-mono font-medium bg-primary/10 text-primary border border-primary/20">
          {row.totalTokens.toLocaleString()}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Time",
      render: (row: RagTokenRow) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {row.createdAt ? formatDistanceToNow(new Date(row.createdAt), { addSuffix: true }) : "N/A"}
        </span>
      ),
    },
  ], []);

  return (
    <DataTable<RagTokenRow>
      columns={columns as any}
      data={data}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      emptyState={
        <div className="flex p-8 items-center justify-center text-muted-foreground bg-card/30 rounded-2xl border border-border/40">
          No RAG token logs found.
        </div>
      }
    />
  );
}
