import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/workspace/page-shell";
import { StatCard } from "@/components/workspace/stat-card";
import { WorkspacePagination } from "@/components/workspace/workspace-pagination";
import { getAiCostSummary, getTelemetryOverview } from "@/lib/db/queries";
import {
  createUrlSearchParams,
  getSearchParamValue,
  normalizePaginationInput,
  type SearchParams,
} from "@/lib/pagination";
import {
  getPaginatedRagTelemetryRows,
  getRagTelemetrySummary,
} from "@/lib/rag/service";

const VALID_DAY_WINDOWS = new Set([7, 30, 90]);

function buildTelemetryHref(
  searchParams: SearchParams,
  updates: Record<string, string | undefined>
) {
  const params = createUrlSearchParams(searchParams);

  for (const [key, value] of Object.entries(updates)) {
    if (!value) {
      params.delete(key);
      continue;
    }

    params.set(key, value);
  }

  const query = params.toString();
  return query.length > 0 ? `/telemetry?${query}` : "/telemetry";
}

function getActionClassName(isActive: boolean) {
  return isActive
    ? "inline-flex h-10 items-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition hover:bg-foreground/90"
    : "inline-flex h-10 items-center rounded-xl border border-border/40 bg-background/70 px-4 text-sm font-medium transition hover:bg-muted";
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const rawDays = getSearchParamValue(params.days);
  const parsedDays = rawDays ? Number.parseInt(rawDays, 10) : 30;
  const days = VALID_DAY_WINDOWS.has(parsedDays) ? parsedDays : 30;
  const paginationInput = normalizePaginationInput({
    page: getSearchParamValue(params.page),
    pageSize: getSearchParamValue(params.pageSize),
  });

  const [telemetry, ragSummary, ragRows, aiCost] = await Promise.all([
    getTelemetryOverview({ days }),
    getRagTelemetrySummary({ days }),
    getPaginatedRagTelemetryRows({
      days,
      page: paginationInput.page,
      pageSize: paginationInput.pageSize,
    }),
    getAiCostSummary({ days }),
  ]);

  if (
    paginationInput.didNormalizeInput ||
    ragRows.pagination.page !== paginationInput.page ||
    (rawDays != null && String(days) !== rawDays)
  ) {
    redirect(
      buildTelemetryHref(params, {
        days: String(days),
        page: String(ragRows.pagination.page),
        pageSize: String(ragRows.pagination.pageSize),
      })
    );
  }

  return (
    <PageShell
      actions={
        <>
          <Link
            className={getActionClassName(days === 7)}
            href={buildTelemetryHref(params, {
              days: "7",
              page: "1",
              pageSize: String(ragRows.pagination.pageSize),
            })}
          >
            7 days
          </Link>
          <Link
            className={getActionClassName(days === 30)}
            href={buildTelemetryHref(params, {
              days: "30",
              page: "1",
              pageSize: String(ragRows.pagination.pageSize),
            })}
          >
            30 days
          </Link>
          <Link
            className={getActionClassName(days === 90)}
            href={buildTelemetryHref(params, {
              days: "90",
              page: "1",
              pageSize: String(ragRows.pagination.pageSize),
            })}
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
          hint="Recipient deliveries recorded via SES"
          label="Email Sends"
          value={String(telemetry.totals.emailDeliveries)}
        />
        <StatCard
          hint="Recipient sends that failed"
          label="Email Failures"
          value={String(telemetry.totals.emailFailures)}
        />
        <StatCard
          hint={`Chat ${aiCost.chatCost.toFixed(6)} • RAG ${aiCost.ragCost.toFixed(6)}`}
          label="Estimated AI Cost"
          value={`$${aiCost.totalCost.toFixed(6)}`}
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
          {ragRows.items.length === 0 ? (
            <div className="rounded-2xl bg-background/70 px-4 py-3 text-sm text-muted-foreground">
              No RAG operations recorded yet.
            </div>
          ) : (
            ragRows.items.map((row) => (
              <div
                className="grid grid-cols-[1.2fr_0.9fr_0.8fr_0.8fr_0.9fr_1fr] gap-3 rounded-2xl bg-background/70 px-4 py-3 text-sm"
                data-testid="rag-row"
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

        <WorkspacePagination
          className="mt-4"
          pagination={ragRows.pagination}
          pathname="/telemetry"
          searchParams={params}
        />
      </div>
    </PageShell>
  );
}
