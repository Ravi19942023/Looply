import { Activity, MessageSquare, Database } from "lucide-react";
import { KpiCard } from "@/components/data-display/KpiCard";

export interface TelemetrySummary {
  totalTokens: number;
  chatTokens: number;
  ragTokens: number;
}

export function MetricsSummaryCards({ summary }: { summary: TelemetrySummary }) {
  return (
    <div className="grid gap-4 md:grid-cols-3 mb-8">
      <KpiCard
        label="Total Token Usage"
        value={summary.totalTokens}
        icon={<Activity size={18} />}
        tone="default"
      />
      
      <KpiCard
        label="LLM Chat Tokens"
        value={summary.chatTokens}
        icon={<MessageSquare size={18} />}
        tone="default"
      />
      
      <KpiCard
        label="RAG Operations Tokens"
        value={summary.ragTokens}
        icon={<Database size={18} />}
        tone="default"
      />
    </div>
  );
}

