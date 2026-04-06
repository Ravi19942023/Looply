import Link from "next/link";
import { CustomerResultsCard } from "@/components/chat/customer-results-card";
import { PageShell } from "@/components/workspace/page-shell";
import { StatCard } from "@/components/workspace/stat-card";
import { getDashboardOverview } from "@/lib/db/queries";

function formatValue(format: "currency" | "number", value: number) {
  if (format === "currency") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }

  return new Intl.NumberFormat("en-US").format(value);
}

export default async function Page() {
  const overview = await getDashboardOverview();

  return (
    <PageShell
      actions={
        <>
          <Link
            className="inline-flex h-10 items-center rounded-xl border border-border/40 bg-background/70 px-4 text-sm font-medium transition hover:bg-muted"
            href="/assistant"
          >
            Open Assistant
          </Link>
          <Link
            className="inline-flex h-10 items-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition hover:bg-foreground/90"
            href="/campaigns?status=draft"
          >
            Review Drafts
          </Link>
        </>
      }
      description="A first-pass Looply workspace overview using the real seeded customer, campaign, knowledge, and chat data."
      title="Dashboard"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overview.kpis.map((kpi) => (
          <StatCard
            hint={
              kpi.label === "Campaigns"
                ? `${overview.totals.sentCampaignCount} sent`
                : undefined
            }
            key={kpi.label}
            label={kpi.label}
            value={formatValue(kpi.format, Number(kpi.value))}
          />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-6">
          <CustomerResultsCard
            customers={overview.topCustomers}
            title="Top Customers"
          />

          <div className="rounded-3xl border border-border/40 bg-card/60 p-5 shadow-[var(--shadow-card)]">
            <div className="mb-4 text-sm font-semibold">Recent Campaigns</div>
            <div className="space-y-3">
              {overview.recentCampaigns.map((campaign) => (
                <div
                  className="rounded-2xl border border-border/30 bg-background/70 px-4 py-3"
                  key={campaign.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-sm">{campaign.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {campaign.subject}
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>{campaign.segment}</div>
                      <div className="mt-1 capitalize">{campaign.status}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-border/40 bg-card/60 p-5 shadow-[var(--shadow-card)]">
            <div className="mb-4 text-sm font-semibold">Recent Chats</div>
            <div className="space-y-3">
              {overview.recentChats.map((chat) => (
                <Link
                  className="block rounded-2xl border border-border/30 bg-background/70 px-4 py-3 transition hover:bg-muted/60"
                  href={`/assistant/${chat.id}`}
                  key={chat.id}
                >
                  <div className="font-medium text-sm">{chat.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {chat.visibility} chat •{" "}
                    {new Date(chat.createdAt).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border/40 bg-card/60 p-5 shadow-[var(--shadow-card)]">
            <div className="mb-4 text-sm font-semibold">
              Knowledge Highlights
            </div>
            <div className="space-y-3">
              {overview.recentKnowledge.map((entry) => (
                <Link
                  className="block rounded-2xl border border-border/30 bg-background/70 px-4 py-3 transition hover:bg-muted/60"
                  href={`/knowledge-base?q=${encodeURIComponent(entry.title)}`}
                  key={entry.id}
                >
                  <div className="font-medium text-sm">{entry.title}</div>
                  <div className="mt-1 line-clamp-3 text-xs text-muted-foreground">
                    {entry.content}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
