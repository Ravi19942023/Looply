import { Suspense } from "react";
import { PageHeader } from "@/components/data-display";
import { Skeleton } from "@/components/feedback/Skeleton";
import { getAuditLogsPaginated, getToolLogsPaginated } from "@/lib/db/queries.logs";

import {
  SystemLogsTabs,
  LogsPagination,
  AuditLogTable,
  ToolLogTable,
} from "@/features/system-logs";

export default async function SystemLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const resolvedParams = await searchParams;
  const tab = (resolvedParams.tab as string) || "audit";
  const pageNumber = parseInt((resolvedParams.page as string) || "1", 10);
  const limit = 20;
  const offset = (pageNumber - 1) * limit;

  return (
    <div className="flex flex-col gap-8 flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-8">
      <PageHeader
        eyebrow="System"
        title="Logs"
        description="Comprehensive audit trail and tool execution data for system observability."
      />

      <div className="space-y-6 flex-1 min-h-0">
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <h2 className="text-xl font-semibold">Activity Logs</h2>
          <SystemLogsTabs />
        </div>

        <div className="bg-card/50 backdrop-blur-sm rounded-3xl border border-border/40 p-1">
          <Suspense fallback={<TableSkeleton />} key={`${tab}-${pageNumber}`}>
            {tab === "audit" ? (
              <AuditData limit={limit} offset={offset} currentPage={pageNumber} />
            ) : (
              <ToolData limit={limit} offset={offset} currentPage={pageNumber} />
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

async function AuditData({
  limit,
  offset,
  currentPage,
}: {
  limit: number;
  offset: number;
  currentPage: number;
}) {
  const { rows, totalCount } = await getAuditLogsPaginated({ limit, offset });
  
  return (
    <div className="space-y-4 w-full overflow-hidden">
      <AuditLogTable data={rows} />
      <div className="p-4 border-t border-border/40">
        <LogsPagination
          page={currentPage}
          pageSize={limit}
          total={totalCount}
          totalPages={Math.ceil(totalCount / limit) || 1}
        />
      </div>
    </div>
  );
}

async function ToolData({
  limit,
  offset,
  currentPage,
}: {
  limit: number;
  offset: number;
  currentPage: number;
}) {
  const { rows, totalCount } = await getToolLogsPaginated({ limit, offset });

  return (
    <div className="space-y-4 w-full overflow-hidden">
      <ToolLogTable data={rows} />
      <div className="p-4 border-t border-border/40">
        <LogsPagination
          page={currentPage}
          pageSize={limit}
          total={totalCount}
          totalPages={Math.ceil(totalCount / limit) || 1}
        />
      </div>
    </div>
  );
}
