import { cn } from "@/lib/utils";

type ChatSessionTelemetryRow = {
  actorEmail: string | null;
  chatId: string | null;
  completionTokens: number;
  lastActivityAt: Date;
  model: string | null;
  promptTokens: number;
  startedAt: Date;
  title: string | null;
  totalTokens: number;
};

function formatDate(value: Date) {
  return value.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TelemetryChatSessionsTable({
  items,
}: {
  items: ChatSessionTelemetryRow[];
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border/30 bg-background/50 px-4 py-8 text-sm text-center text-muted-foreground">
        No chat session telemetry was recorded for this time window.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border/30 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">
            <th className="px-4 py-3 pb-2 font-bold uppercase">Session Title</th>
            <th className="px-4 py-3 pb-2 font-bold uppercase">Model</th>
            <th className="px-4 py-3 pb-2 font-bold uppercase">Initiator</th>
            <th className="px-4 py-3 pb-2 font-bold uppercase text-right">In</th>
            <th className="px-4 py-3 pb-2 font-bold uppercase text-right">Out</th>
            <th className="px-4 py-3 pb-2 font-bold uppercase text-right">Total</th>
            <th className="px-4 py-3 pb-2 font-bold uppercase text-right">Last Activity</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/20">
          {items.map((row) => (
            <tr
              className="hover:bg-muted/30 transition-colors group"
              key={`${row.chatId ?? "unknown"}-${row.model ?? "unknown"}-${row.lastActivityAt.toISOString()}`}
            >
              <td className="max-w-xs truncate px-4 py-3.5 font-medium">
                {row.title || "Untitled Session"}
              </td>
              <td className="px-4 py-3.5">
                <span className="inline-flex rounded-lg border border-border/30 bg-muted/50 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-muted-foreground">
                  {row.model || "Unknown"}
                </span>
              </td>
              <td className="px-4 py-3.5 text-xs text-muted-foreground">
                {row.actorEmail || "Anonymous"}
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
                {formatDate(row.lastActivityAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
