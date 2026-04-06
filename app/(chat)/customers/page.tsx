import Link from "next/link";
import { redirect } from "next/navigation";
import { Input } from "@/components/ui/input";
import { WorkspacePagination } from "@/components/workspace/workspace-pagination";
import { PageShell } from "@/components/workspace/page-shell";
import { getPaginatedCustomerDirectory } from "@/lib/db/queries";
import {
  createUrlSearchParams,
  getSearchParamValue,
  normalizePaginationInput,
  type SearchParams,
} from "@/lib/pagination";

function buildCustomersHref(
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
  return query.length > 0 ? `/customers?${query}` : "/customers";
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const q = getSearchParamValue(params.q)?.trim() ?? "";
  const segment = getSearchParamValue(params.segment) ?? "all";
  const rawSort = getSearchParamValue(params.sort);
  const sort = rawSort === "churn" ? "churn" : "revenue";
  const paginationInput = normalizePaginationInput({
    page: getSearchParamValue(params.page),
    pageSize: getSearchParamValue(params.pageSize),
  });

  const { items, pagination } = await getPaginatedCustomerDirectory({
    page: paginationInput.page,
    pageSize: paginationInput.pageSize,
    q,
    segment,
    sort,
  });

  if (
    paginationInput.didNormalizeInput ||
    pagination.page !== paginationInput.page ||
    (rawSort != null && rawSort !== sort)
  ) {
    redirect(
      buildCustomersHref(params, {
        page: String(pagination.page),
        pageSize: String(pagination.pageSize),
        q: q || undefined,
        segment: segment === "all" ? undefined : segment,
        sort: sort === "revenue" ? undefined : sort,
      })
    );
  }

  return (
    <PageShell
      description="Search the seeded customer directory by segment, name, company tags, revenue, and churn risk."
      title="Customers"
    >
      <form className="mb-6 grid gap-3 rounded-3xl border border-border/40 bg-card/60 p-4 shadow-[var(--shadow-card)] md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
        <input name="page" type="hidden" value="1" />
        <input
          name="pageSize"
          type="hidden"
          value={String(pagination.pageSize)}
        />
        <Input
          defaultValue={q}
          name="q"
          placeholder="Search name, email, segment, or tags"
        />
        <select
          className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
          defaultValue={segment}
          name="segment"
        >
          <option value="all">All segments</option>
          <option value="general">General</option>
          <option value="premium">Premium</option>
          <option value="enterprise">Enterprise</option>
          <option value="inactive">Inactive</option>
          <option value="growth">Growth</option>
        </select>
        <select
          className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
          defaultValue={sort}
          name="sort"
        >
          <option value="revenue">Sort by revenue</option>
          <option value="churn">Sort by churn risk</option>
        </select>
        <button
          className="inline-flex h-10 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition hover:bg-foreground/90"
          type="submit"
        >
          Apply
        </button>
      </form>

      <div className="overflow-hidden rounded-3xl border border-border/40 bg-card/60 shadow-[var(--shadow-card)]">
        <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_0.8fr] gap-3 border-b border-border/30 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
          <span>Customer</span>
          <span>Segment</span>
          <span>Revenue</span>
          <span>Orders</span>
          <span>Churn</span>
        </div>
        <div className="divide-y divide-border/30">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-sm text-muted-foreground">
              No customers match the current filters.
            </div>
          ) : (
            items.map((customer) => (
              <div
                className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_0.8fr] gap-3 px-4 py-4 text-sm"
                data-testid="customer-row"
                key={customer.id}
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{customer.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {customer.email}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {customer.tags.slice(0, 2).map((tag) => (
                      <span
                        className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                        key={tag}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="capitalize">{customer.segment}</div>
                <div>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  }).format(Number(customer.totalRevenue ?? 0))}
                </div>
                <div>{customer.orderCount ?? 0}</div>
                <div>
                  {Math.round(Number(customer.churnRiskScore ?? 0) * 100)}%
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <WorkspacePagination
        pagination={pagination}
        pathname="/customers"
        searchParams={params}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          className="text-sm text-muted-foreground hover:text-foreground"
          href={buildCustomersHref(params, {
            page: "1",
            pageSize: String(pagination.pageSize),
            segment: "enterprise",
          })}
        >
          Enterprise
        </Link>
        <Link
          className="text-sm text-muted-foreground hover:text-foreground"
          href={buildCustomersHref(params, {
            page: "1",
            pageSize: String(pagination.pageSize),
            segment: "inactive",
          })}
        >
          Inactive
        </Link>
        <Link
          className="text-sm text-muted-foreground hover:text-foreground"
          href={buildCustomersHref(params, {
            page: "1",
            pageSize: String(pagination.pageSize),
            sort: "churn",
          })}
        >
          High churn
        </Link>
      </div>
    </PageShell>
  );
}
