import { Activity, Bot, Coins, Database, SearchCheck, Shapes } from "lucide-react";

type TelemetrySummary = {
  chatTokens: number;
  ragTokens: number;
  totalTokens: number;
};

type TelemetryCostSummary = {
  chatCost: number;
  ragCost: number;
  totalCost: number;
};

type RagTelemetrySummary = {
  documentEmbedCount: number;
  queryEmbedCount: number;
  retrievalCount: number;
  totalTokens: number;
};

function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}

export function TelemetrySummaryCards({
  cost,
  rag,
  summary,
}: {
  cost: TelemetryCostSummary;
  rag: RagTelemetrySummary;
  summary: TelemetrySummary;
}) {
  const cards = [
    {
      label: "Total Tokens",
      value: formatNumber(summary.totalTokens),
      hint: "All chat + RAG operations",
      icon: Activity,
    },
    {
      label: "Estimated Cost",
      value: `$${cost.totalCost.toFixed(4)}`,
      hint: `Chat $${cost.chatCost.toFixed(4)} • RAG $${cost.ragCost.toFixed(4)}`,
      icon: Coins,
    },
    {
      label: "Chat Usage",
      value: formatNumber(summary.chatTokens),
      hint: "LLM prompts and responses",
      icon: Bot,
    },
    {
      label: "RAG Usage",
      value: formatNumber(summary.ragTokens),
      hint: "Retrieval and embeddings",
      icon: Database,
    },
    {
      label: "Embeddings",
      value: formatNumber(rag.queryEmbedCount + rag.documentEmbedCount),
      hint: "Text vectorizations",
      icon: Shapes,
    },
    {
      label: "Retrievals",
      value: formatNumber(rag.retrievalCount),
      hint: "Semantic searches",
      icon: SearchCheck,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <div
          className="rounded-2xl border border-border/40 bg-card/60 p-4 shadow-[var(--shadow-card)]"
          key={card.label}
        >
          <div className="flex items-center gap-2">
            <card.icon className="size-3.5 text-muted-foreground/60" />
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/60">
              {card.label}
            </span>
          </div>
          <div className="mt-2 text-xl font-bold tracking-tight">
            {card.value}
          </div>
          <div className="mt-1.5 text-[10px] text-muted-foreground/80 font-medium">
            {card.hint}
          </div>
        </div>
      ))}
    </div>
  );
}
