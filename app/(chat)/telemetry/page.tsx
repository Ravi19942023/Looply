import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/workspace/page-shell";
import { TelemetryChatSessionsTable } from "@/components/workspace/telemetry-chat-sessions-table";
import { TelemetryRagOperationsTable } from "@/components/workspace/telemetry-rag-operations-table";
import { TelemetrySummaryCards } from "@/components/workspace/telemetry-summary-cards";
import { TelemetryTabs } from "@/components/workspace/telemetry-tabs";
import { WorkspacePagination } from "@/components/workspace/workspace-pagination";
import {
  getAiCostSummary,
  getPaginatedChatSessionsTelemetry,
  getTelemetrySummary,
} from "@/lib/db/queries";
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
 
const DEFAULT_TELEMETRY_TAB = "chats";
const TELEMETRY_PAGE_SIZE = 10;

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
    ? "inline-flex h-8 items-center rounded-lg bg-foreground px-3 text-[11px] font-bold uppercase tracking-[0.1em] text-background transition hover:bg-foreground/90"
    : "inline-flex h-8 items-center rounded-lg border border-border/40 bg-background/50 px-3 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground transition hover:bg-muted hover:text-foreground";
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const days = 365; // Default to full history window for recent records
  const rawTab = getSearchParamValue(params.tab);
  const tab = rawTab === "rag" ? "rag" : DEFAULT_TELEMETRY_TAB;
  const paginationInput = normalizePaginationInput({
    page: getSearchParamValue(params.page),
    pageSize: getSearchParamValue(params.pageSize),
    defaultPageSize: TELEMETRY_PAGE_SIZE,
    maxPageSize: TELEMETRY_PAGE_SIZE,
  });

  const [summary, ragSummary, cost, chatSessions, ragRows] = await Promise.all([
    getTelemetrySummary({ days }),
    getRagTelemetrySummary({ days }),
    getAiCostSummary({ days }),
    getPaginatedChatSessionsTelemetry({
      days,
      page: paginationInput.page,
      pageSize: paginationInput.pageSize,
    }),
    getPaginatedRagTelemetryRows({
      days,
      page: paginationInput.page,
      pageSize: paginationInput.pageSize,
    }),
  ]);

  const activeData = tab === "rag" ? ragRows : chatSessions;

  if (
    paginationInput.didNormalizeInput ||
    activeData.pagination.page !== paginationInput.page ||
    (rawTab != null && rawTab !== tab)
  ) {
    redirect(
      buildTelemetryHref(params, {
        page: String(activeData.pagination.page),
        pageSize: String(activeData.pagination.pageSize),
        tab: tab === DEFAULT_TELEMETRY_TAB ? undefined : tab,
      })
    );
  }

  return (
    <PageShell
      description="Detailed platform usage audit for token interactions and pipeline execution."
      title="Platform Telemetry"
    >
      <TelemetrySummaryCards cost={cost} rag={ragSummary} summary={summary} />

      <div className="mt-8 overflow-hidden rounded-2xl border border-border/40 bg-card/60 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between border-b border-border/30 px-6">
          <TelemetryTabs
            currentTab={tab}
            pageSize={TELEMETRY_PAGE_SIZE}
            searchParams={params}
          />
          <div className="hidden sm:flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/40">
             <span>{activeData.pagination.total} Records Found</span>
          </div>
        </div>

        <div className="min-h-[400px]">
          {tab === "rag" ? (
            <TelemetryRagOperationsTable items={ragRows.items} />
          ) : (
            <TelemetryChatSessionsTable items={chatSessions.items} />
          )}
        </div>

        <div className="border-t border-border/20 bg-muted/10 px-6 py-4">
          <WorkspacePagination
            pagination={activeData.pagination}
            pathname="/telemetry"
            searchParams={params}
          />
        </div>
      </div>
      
      <div className="mt-6 flex flex-wrap gap-8 text-[11px] text-muted-foreground leading-relaxed">
        <div className="flex items-center gap-2">
           <div className="size-1.5 rounded-full bg-emerald-500/40" />
           <span>Estimated Costs (~$0.01/1k tokens generic rate)</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="size-1.5 rounded-full bg-indigo-500/40" />
           <span>Real-time Data Stream (Delayed ~5s)</span>
        </div>
      </div>
    </PageShell>
  );
}
