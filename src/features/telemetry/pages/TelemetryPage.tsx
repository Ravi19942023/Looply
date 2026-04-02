import { Suspense } from "react";
import { getTelemetrySummary, getChatSessionsTelemetryPaginated, getRagTelemetryPaginated } from "@/lib/db/queries.telemetry";
import { MetricsSummaryCards } from "../components/MetricsSummaryCards";
import { TelemetryTabs } from "../components/TelemetryTabs";
import { ChatSessionsTable } from "../components/ChatSessionsTable";
import { RagTokenTable } from "../components/RagTokenTable";
import { Skeleton } from "@/components/feedback/Skeleton";
import { PageHeader } from "@/components/data-display";
import { PaginationWrapper } from "../components/PaginationWrapper";



export default async function TelemetryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const resolvedParams = await searchParams;
  const tab = (resolvedParams.tab as string) || "chats";
  const pageNumber = parseInt((resolvedParams.page as string) || "1", 10);
  const limit = 20;
  const offset = (pageNumber - 1) * limit;

  const summary = await getTelemetrySummary();

  return (
    <div className="flex flex-col gap-8 flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-8">
      <PageHeader
        eyebrow="Operations"
        title="Token Telemetry"
        description="Monitor platform token usage across all chat sessions and RAG pipeline operations."
      />

      <MetricsSummaryCards summary={summary} />

      <div className="space-y-6 flex-1 min-h-0">
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <h2 className="text-xl font-semibold">Detailed Logs</h2>
          <TelemetryTabs />
        </div>

        <div className="bg-card/50 backdrop-blur-sm rounded-3xl border border-border/40 p-1">
          <Suspense fallback={<TableSkeleton />}>
            {tab === "chats" ? (
              <ChatSessionsData limit={limit} offset={offset} currentPage={pageNumber} />
            ) : (
              <RagData limit={limit} offset={offset} currentPage={pageNumber} />
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

async function ChatSessionsData({ limit, offset, currentPage }: { limit: number; offset: number; currentPage: number }) {
  const { rows, totalCount, hasMore } = await getChatSessionsTelemetryPaginated({ limit, offset });
  // Ensure non-nullable chatId for UI stability
  const safeRows = rows.map(r => ({
    ...r,
    chatId: r.chatId ?? "unknown"
  }));
  return (
    <div className="space-y-4 w-full overflow-hidden">
      <ChatSessionsTable data={safeRows} />
      <div className="p-4 border-t border-border/40">
        <PaginationWrapper
          page={currentPage}
          pageSize={limit}
          total={totalCount}
          totalPages={Math.ceil(totalCount / limit)}
        />
      </div>
    </div>
  );
}


async function RagData({ limit, offset, currentPage }: { limit: number; offset: number; currentPage: number }) {
  const { rows, totalCount, hasMore } = await getRagTelemetryPaginated({ limit, offset });
  return (
    <div className="space-y-4 w-full overflow-hidden">
      <RagTokenTable data={rows} />
      <div className="p-4 border-t border-border/40">
        <PaginationWrapper
          page={currentPage}
          pageSize={limit}
          total={totalCount}
          totalPages={Math.ceil(totalCount / limit)}
        />
      </div>
    </div>
  );
}
