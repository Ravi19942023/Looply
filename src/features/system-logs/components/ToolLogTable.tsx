"use client";

import { DataTable } from "@/components/data-display/DataTable";

type ToolRow = {
  id: string;
  toolName: string;
  stepIndex: number | null;
  chatTitle: string | null;
  chatId: string;
  input: unknown;
  output: unknown;
  createdAt: Date;
};

interface ToolLogTableProps {
  data: ToolRow[];
}

function renderJsonPayload(data: unknown) {
  if (data === undefined || data === null) return "-";
  
  const serialized = typeof data === "string" ? data : JSON.stringify(data);
  const truncated = serialized.length > 50 ? `${serialized.slice(0, 50)}...` : serialized;

  return (
    <div className="relative group flex items-center gap-2">
      <code 
        className="px-2 py-0.5 rounded bg-muted text-xs font-mono text-muted-foreground line-clamp-1 break-all cursor-help"
        title={serialized}
      >
        {truncated}
      </code>
    </div>
  );
}

export function ToolLogTable({ data }: ToolLogTableProps) {
  return (
    <DataTable
      columns={[
        {
          key: "chat",
          header: "Chat Context",
          render: (row) => (
            <div className="flex flex-col">
              <span className="font-medium line-clamp-1">{row.chatTitle || "Untitled Session"}</span>
              <span className="text-xs text-muted-foreground font-mono">
                {row.chatId}
              </span>
            </div>
          ),
        },
        {
          key: "toolName",
          header: "Tool Name",
          render: (row) => (
            <span className="inline-flex items-center rounded-sm bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {row.toolName} {row.stepIndex !== null ? `(Step ${row.stepIndex})` : ""}
            </span>
          ),
        },
        {
          key: "input",
          header: "Input",
          render: (row) => renderJsonPayload(row.input),
        },
        {
          key: "output",
          header: "Output",
          render: (row) => renderJsonPayload(row.output),
        },
        {
          key: "createdAt",
          header: "Execution Time",
          render: (row) => (
            <span className="text-muted-foreground whitespace-nowrap">
              {new Date(row.createdAt).toLocaleString()}
            </span>
          ),
          align: "right",
        },
      ]}
      data={data}
      getRowId={(row) => row.id}
      emptyState={
        <div className="p-8 text-center text-muted-foreground border border-border/40 rounded-2xl bg-card/30 backdrop-blur-sm">
          No tool executions found.
        </div>
      }
    />
  );
}
