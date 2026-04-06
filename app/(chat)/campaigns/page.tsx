import Link from "next/link";
import { redirect } from "next/navigation";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/workspace/page-shell";
import { WorkspacePagination } from "@/components/workspace/workspace-pagination";
import { getPaginatedCampaignDirectory } from "@/lib/db/queries";
import {
  createUrlSearchParams,
  getSearchParamValue,
  normalizePaginationInput,
  type SearchParams,
} from "@/lib/pagination";

function buildCampaignsHref(
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
  return query.length > 0 ? `/campaigns?${query}` : "/campaigns";
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const q = getSearchParamValue(params.q)?.trim() ?? "";
  const rawStatus = getSearchParamValue(params.status);
  const status =
    rawStatus === "draft" ||
    rawStatus === "sent" ||
    rawStatus === "partial" ||
    rawStatus === "failed"
      ? rawStatus
      : "all";
  const paginationInput = normalizePaginationInput({
    page: getSearchParamValue(params.page),
    pageSize: getSearchParamValue(params.pageSize),
  });

  const { items, pagination } = await getPaginatedCampaignDirectory({
    page: paginationInput.page,
    pageSize: paginationInput.pageSize,
    q,
    status,
  });

  if (
    paginationInput.didNormalizeInput ||
    pagination.page !== paginationInput.page ||
    (rawStatus != null && rawStatus !== status)
  ) {
    redirect(
      buildCampaignsHref(params, {
        page: String(pagination.page),
        pageSize: String(pagination.pageSize),
        q: q || undefined,
        status: status === "all" ? undefined : status,
      })
    );
  }

  return (
    <PageShell
      actions={
        <Link
          className="inline-flex h-10 items-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition hover:bg-foreground/90"
          href="/assistant?query=Create%20a%20campaign%20draft%20for%20premium%20customers"
        >
          Create via Assistant
        </Link>
      }
      description="Inspect draft and sent campaigns, recipient counts, and logged delivery outcomes from the seeded campaign data."
      title="Campaigns"
    >
      <form className="mb-6 grid gap-3 rounded-3xl border border-border/40 bg-card/60 p-4 shadow-[var(--shadow-card)] md:grid-cols-[minmax(0,1fr)_220px_auto]">
        <input name="page" type="hidden" value="1" />
        <input
          name="pageSize"
          type="hidden"
          value={String(pagination.pageSize)}
        />
        <Input
          defaultValue={q}
          name="q"
          placeholder="Search campaign name, subject, or segment"
        />
        <select
          className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
          defaultValue={status}
          name="status"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="partial">Partial</option>
          <option value="failed">Failed</option>
        </select>
        <button
          className="inline-flex h-10 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition hover:bg-foreground/90"
          type="submit"
        >
          Apply
        </button>
      </form>

      <div className="grid gap-4 xl:grid-cols-2">
        {items.length === 0 ? (
          <div className="rounded-3xl border border-border/40 bg-card/60 p-5 text-sm text-muted-foreground shadow-[var(--shadow-card)]">
            No campaigns match the current filters.
          </div>
        ) : (
          items.map((campaign) => (
            <div
              className="rounded-3xl border border-border/40 bg-card/60 p-5 shadow-[var(--shadow-card)]"
              data-testid="campaign-card"
              key={campaign.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-bold tracking-tight">
                    {campaign.name}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {campaign.subject}
                  </div>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize text-muted-foreground">
                  {campaign.status}
                </span>
              </div>

              <div className="mt-4 grid gap-3 rounded-2xl border border-border/30 bg-background/70 p-4 sm:grid-cols-2">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">
                    Segment
                  </div>
                  <div className="mt-1 text-sm capitalize">
                    {campaign.segment}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">
                    Recipients
                  </div>
                  <div className="mt-1 text-sm">{campaign.recipientCount}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">
                    Delivered
                  </div>
                  <div className="mt-1 text-sm">{campaign.sentCount}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">
                    Failed
                  </div>
                  <div className="mt-1 text-sm">{campaign.failedCount}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">
                    Provider
                  </div>
                  <div className="mt-1 text-sm">ses</div>
                </div>
              </div>

              {campaign.sentAt ? (
                <div className="mt-4 text-xs text-muted-foreground">
                  Sent{" "}
                  {new Date(campaign.sentAt).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </div>
              ) : (
                <div className="mt-4 text-xs text-muted-foreground">
                  Draft created{" "}
                  {new Date(campaign.createdAt).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <WorkspacePagination
        pagination={pagination}
        pathname="/campaigns"
        searchParams={params}
      />
    </PageShell>
  );
}
