"use client";

type KnowledgeResult = {
  fileName?: string;
  id: string;
  scope?: "global" | "session";
  score?: number;
  text: string;
  title?: string;
};

export function KnowledgeResultsCard({
  results,
}: Readonly<{
  results: KnowledgeResult[];
}>) {
  return (
    <div className="w-[min(100%,620px)] rounded-2xl border border-border/50 bg-card/60 p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-medium text-sm">Knowledge Matches</div>
        <div className="text-muted-foreground text-xs">
          {results.length} source{results.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="space-y-3">
        {results.map((result) => (
          <div
            className="rounded-xl border border-border/40 bg-background/70 p-4"
            key={result.id}
          >
            <div className="mb-1 flex items-center justify-between gap-3">
              <div className="font-medium text-sm">
                {result.fileName ?? result.title ?? "Knowledge source"}
              </div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/60">
                {result.scope ?? "global"}
              </div>
            </div>
            {typeof result.score === "number" ? (
              <div className="mb-2 text-[11px] text-muted-foreground">
                Relevance {Math.round(result.score * 100)}%
              </div>
            ) : null}
            <div className="line-clamp-4 whitespace-pre-wrap text-[13px] leading-6 text-muted-foreground">
              {result.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
