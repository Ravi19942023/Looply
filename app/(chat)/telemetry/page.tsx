import Link from "next/link";
import { PageShell } from "@/components/workspace/page-shell";
import { StatCard } from "@/components/workspace/stat-card";
import { getTelemetryOverview } from "@/lib/db/queries";
import { getRagTelemetryRows, getRagTelemetrySummary } from "@/lib/rag/service";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const rawDays = typeof params.days === "string" ? Number(params.days) : 30;
  const days = Number.isFinite(rawDays) ? rawDays : 30;
  const [telemetry, ragSummary, ragRows] = await Promise.all([
    getTelemetryOverview({ days }),
    getRagTelemetrySummary({ days }),
    getRagTelemetryRows({ days }),
  ]);

  return (
    <PageShell
      actions={
        <>
          <Link
            className="inline-flex h-10 items-center rounded-xl border border-border/40 bg-background/70 px-4 text-sm font-medium transition hover:bg-muted"
            href="/telemetry?days=7"
          >
            7 days
          </Link>
          <Link
            className="inline-flex h-10 items-center rounded-xl border border-border/40 bg-background/70 px-4 text-sm font-medium transition hover:bg-muted"
            href="/telemetry?days=30"
          >
            30 days
          </Link>
          <Link
            className="inline-flex h-10 items-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition hover:bg-foreground/90"
            href="/telemetry?days=90"
          >
            90 days
          </Link>
        </>
      }
      description="Derived operational telemetry from the current chat, artifact, and campaign tables without adding a separate telemetry backend."
      title="Telemetry"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          hint="All assistant and user messages in range"
          label="Messages"
          value={String(telemetry.totals.messages)}
        />
        <StatCard
          hint={`${telemetry.totals.assistantMessages} assistant / ${telemetry.totals.userMessages} user`}
          label="Chats"
          value={String(telemetry.totals.chats)}
        />
        <StatCard
          hint={`${telemetry.totals.sentCampaigns} sent in range`}
          label="Campaigns"
          value={String(telemetry.totals.campaigns)}
        />
        <StatCard
          hint="Document revisions created in range"
          label="Documents"
          value={String(telemetry.totals.documents)}
        />
        <StatCard
          hint={`${ragSummary.queryEmbedCount} query embeddings / ${ragSummary.documentEmbedCount} document embeddings`}
          label="RAG Tokens"
          value={String(ragSummary.totalTokens)}
        />
        <StatCard
          hint="Merged semantic + lexical retrieval operations"
          label="RAG Retrievals"
          value={String(ragSummary.retrievalCount)}
        />
      </div>

      <div className="mt-6 rounded-3xl border border-border/40 bg-card/60 p-5 shadow-[var(--shadow-card)]">
        <div className="mb-4 text-sm font-semibold">
          Activity Trend ({telemetry.days} days)
        </div>
        <div className="space-y-3">
          {telemetry.series.map((bucket) => (
            <div
              className="grid grid-cols-[110px_repeat(4,minmax(0,1fr))] gap-3 text-sm"
              key={bucket.key}
            >
              <div className="text-muted-foreground">{bucket.label}</div>
              <div className="rounded-xl bg-background/70 px-3 py-2">
                {bucket.messages} messages
              </div>
              <div className="rounded-xl bg-background/70 px-3 py-2">
                {bucket.chats} chats
              </div>
              <div className="rounded-xl bg-background/70 px-3 py-2">
                {bucket.documents} docs
              </div>
              <div className="rounded-xl bg-background/70 px-3 py-2">
                {bucket.campaigns} campaigns
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-border/40 bg-card/60 p-5 shadow-[var(--shadow-card)]">
        <div className="mb-4 text-sm font-semibold">RAG Operations</div>
        <div className="space-y-3">
          {ragRows.length === 0 ? (
            <div className="rounded-2xl bg-background/70 px-4 py-3 text-sm text-muted-foreground">
              No RAG operations recorded yet.
            </div>
          ) : (
            ragRows.map((row) => (
              <div
                className="grid grid-cols-[1.2fr_0.9fr_0.8fr_0.8fr_0.9fr_1fr] gap-3 rounded-2xl bg-background/70 px-4 py-3 text-sm"
                key={row.id}
              >
                <div>
                  <div className="font-medium">{row.source}</div>
                  <div className="text-xs text-muted-foreground">
                    {row.model ?? "unknown model"}
                  </div>
                </div>
                <div className="text-muted-foreground">
                  {row.actorEmail ?? row.actorId ?? "system"}
                </div>
                <div>{row.chatId ?? "global"}</div>
                <div>{row.promptTokens}</div>
                <div>{row.totalTokens}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(row.createdAt).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PageShell>
  );
}
