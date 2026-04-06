import Link from "next/link";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/workspace/page-shell";
import { getCustomerDirectory } from "@/lib/db/queries";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const q = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const segment = typeof params.segment === "string" ? params.segment : "all";
  const sort = typeof params.sort === "string" ? params.sort : "revenue";
  const customers = await getCustomerDirectory();

  const filtered = customers
    .filter((customer) => {
      const matchesQuery =
        q.length === 0 ||
        customer.name.toLowerCase().includes(q) ||
        customer.email.toLowerCase().includes(q) ||
        customer.segment.toLowerCase().includes(q) ||
        customer.tags.some((tag) => tag.toLowerCase().includes(q));
      const matchesSegment = segment === "all" || customer.segment === segment;
      return matchesQuery && matchesSegment;
    })
    .sort((left, right) => {
      if (sort === "churn") {
        return (
          Number(right.churnRiskScore ?? 0) - Number(left.churnRiskScore ?? 0)
        );
      }
      return Number(right.totalRevenue ?? 0) - Number(left.totalRevenue ?? 0);
    });

  return (
    <PageShell
      description="Search the seeded customer directory by segment, name, company tags, revenue, and churn risk."
      title="Customers"
    >
      <form className="mb-6 grid gap-3 rounded-3xl border border-border/40 bg-card/60 p-4 shadow-[var(--shadow-card)] md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
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
          {filtered.map((customer) => (
            <div
              className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_0.8fr] gap-3 px-4 py-4 text-sm"
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
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          className="text-sm text-muted-foreground hover:text-foreground"
          href="/customers?segment=enterprise"
        >
          Enterprise
        </Link>
        <Link
          className="text-sm text-muted-foreground hover:text-foreground"
          href="/customers?segment=inactive"
        >
          Inactive
        </Link>
        <Link
          className="text-sm text-muted-foreground hover:text-foreground"
          href="/customers?sort=churn"
        >
          High churn
        </Link>
      </div>
    </PageShell>
  );
}
