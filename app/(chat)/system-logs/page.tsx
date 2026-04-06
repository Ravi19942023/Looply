import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/workspace/page-shell";
import { WorkspacePagination } from "@/components/workspace/workspace-pagination";
import {
  getSystemActivityFeed,
  type SystemActivityType,
} from "@/lib/db/queries";
import {
  createUrlSearchParams,
  getSearchParamValue,
  normalizePaginationInput,
  type SearchParams,
} from "@/lib/pagination";

const LOG_TYPES: SystemActivityType[] = [
  "all",
  "campaign",
  "chat",
  "document",
  "email",
  "knowledge",
  "message",
];

function buildSystemLogsHref(
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
  return query.length > 0 ? `/system-logs?${query}` : "/system-logs";
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
  const rawType = getSearchParamValue(params.type);
  const type = LOG_TYPES.includes(rawType as SystemActivityType)
    ? (rawType as SystemActivityType)
    : "all";
  const paginationInput = normalizePaginationInput({
    page: getSearchParamValue(params.page),
    pageSize: getSearchParamValue(params.pageSize),
  });

  const { items, pagination } = await getSystemActivityFeed({
    page: paginationInput.page,
    pageSize: paginationInput.pageSize,
    type,
  });

  if (
    paginationInput.didNormalizeInput ||
    pagination.page !== paginationInput.page ||
    (rawType != null && rawType !== type)
  ) {
    redirect(
      buildSystemLogsHref(params, {
        page: String(pagination.page),
        pageSize: String(pagination.pageSize),
        type: type === "all" ? undefined : type,
      })
    );
  }

  return (
    <PageShell
      actions={
        <>
          <Link
            className={getActionClassName(type === "all")}
            href={buildSystemLogsHref(params, {
              page: "1",
              pageSize: String(pagination.pageSize),
              type: undefined,
            })}
          >
            All
          </Link>
          <Link
            className={getActionClassName(type === "campaign")}
            href={buildSystemLogsHref(params, {
              page: "1",
              pageSize: String(pagination.pageSize),
              type: "campaign",
            })}
          >
            Campaigns
          </Link>
          <Link
            className={getActionClassName(type === "document")}
            href={buildSystemLogsHref(params, {
              page: "1",
              pageSize: String(pagination.pageSize),
              type: "document",
            })}
          >
            Documents
          </Link>
          <Link
            className={getActionClassName(type === "email")}
            href={buildSystemLogsHref(params, {
              page: "1",
              pageSize: String(pagination.pageSize),
              type: "email",
            })}
          >
            Email
          </Link>
          <Link
            className={getActionClassName(type === "knowledge")}
            href={buildSystemLogsHref(params, {
              page: "1",
              pageSize: String(pagination.pageSize),
              type: "knowledge",
            })}
          >
            Knowledge
          </Link>
        </>
      }
      description="Derived recent activity across chats, messages, documents, campaigns, and knowledge updates using current persisted tables."
      title="System Logs"
    >
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-3xl border border-border/40 bg-card/60 px-5 py-4 text-sm text-muted-foreground shadow-[var(--shadow-card)]">
            No activity matched the selected log type.
          </div>
        ) : (
          items.map((entry) => (
            <div
              className="rounded-3xl border border-border/40 bg-card/60 px-5 py-4 shadow-[var(--shadow-card)]"
              data-testid="system-log-entry"
              key={entry.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">
                    {entry.type}
                  </div>
                  <div className="mt-1 font-semibold">{entry.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {entry.description}
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {new Date(entry.createdAt).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </div>
              </div>
              {entry.href ? (
                <div className="mt-3">
                  <Link
                    className="text-sm text-foreground/80 underline-offset-4 hover:text-foreground hover:underline"
                    href={entry.href}
                  >
                    Open related view
                  </Link>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      <WorkspacePagination
        pagination={pagination}
        pathname="/system-logs"
        searchParams={params}
      />
    </PageShell>
  );
}
