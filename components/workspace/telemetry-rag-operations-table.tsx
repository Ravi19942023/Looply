import { cn } from "@/lib/utils";

type RagOperationRow = {
  actorEmail: string | null;
  actorId: string | null;
  chatId: string | null;
  completionTokens: number;
  createdAt: Date;
  id: string;
  metadata: Record<string, unknown>;
  model: string | null;
  promptTokens: number;
  source: string;
  totalTokens: number;
};

const SOURCE_LABELS: Record<string, string> = {
  "rag:embed": "Query Embed",
  "rag:embedTexts": "Doc Embed",
  "rag:retrieve": "Retrieve",
};

function getOperationLabel(source: string) {
  return SOURCE_LABELS[source] ?? source;
}

function formatDate(value: Date) {
  return value.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TelemetryRagOperationsTable({
  items,
}: {
  items: RagOperationRow[];
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border/30 bg-background/50 px-4 py-8 text-sm text-center text-muted-foreground">
        No RAG telemetry was recorded for this time window.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border/30 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">
            <th className="px-4 py-3 pb-2 font-bold uppercase">Operation</th>
            <th className="px-4 py-3 pb-2 font-bold uppercase">Source/Model</th>
            <th className="px-4 py-3 pb-2 font-bold uppercase">Initiator</th>
            <th className="px-4 py-3 pb-2 font-bold uppercase">Scope (Chat)</th>
            <th className="px-4 py-3 pb-2 font-bold uppercase text-right">In</th>
            <th className="px-4 py-3 pb-2 font-bold uppercase text-right">Out</th>
            <th className="px-4 py-3 pb-2 font-bold uppercase text-right">Usage</th>
            <th className="px-4 py-3 pb-2 font-bold uppercase text-right">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/20">
          {items.map((row) => (
            <tr
              className="hover:bg-muted/30 transition-colors group"
              key={row.id}
            >
              <td className="px-4 py-3.5">
                <span className={cn(
                  "inline-flex rounded-lg border border-border/30 px-2 py-0.5 font-sans text-xs font-bold leading-tight",
                  row.source === "rag:retrieve" ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                )}>
                  {getOperationLabel(row.source)}
                </span>
              </td>
              <td className="px-4 py-3.5 text-xs">
                <span className="font-mono text-muted-foreground">{row.model || "Core Engine"}</span>
              </td>
              <td className="px-4 py-3.5 text-xs text-muted-foreground truncate max-w-[120px]">
                {row.actorEmail || row.actorId || "System"}
              </td>
              <td className="px-4 py-3.5 text-xs font-mono text-muted-foreground truncate max-w-[100px]">
                {row.chatId || "Global"}
              </td>
              <td className="px-4 py-3.5 text-right font-mono text-xs text-muted-foreground tabular-nums">
                {row.promptTokens.toLocaleString()}
              </td>
              <td className="px-4 py-3.5 text-right font-mono text-xs text-muted-foreground tabular-nums">
                {row.completionTokens.toLocaleString()}
              </td>
              <td className="px-4 py-3.5 text-right font-mono text-xs font-bold tabular-nums">
                {row.totalTokens.toLocaleString()}
              </td>
              <td className="px-4 py-3.5 text-right text-xs text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {formatDate(row.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
