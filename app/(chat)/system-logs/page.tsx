import Link from "next/link";
import { PageShell } from "@/components/workspace/page-shell";
import { getSystemActivityFeed } from "@/lib/db/queries";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const type = typeof params.type === "string" ? params.type : "all";
  const feed = await getSystemActivityFeed({ limit: 50 });

  const filtered =
    type === "all" ? feed : feed.filter((entry) => entry.type === type);

  return (
    <PageShell
      actions={
        <>
          <Link
            className="inline-flex h-10 items-center rounded-xl border border-border/40 bg-background/70 px-4 text-sm font-medium transition hover:bg-muted"
            href="/system-logs"
          >
            All
          </Link>
          <Link
            className="inline-flex h-10 items-center rounded-xl border border-border/40 bg-background/70 px-4 text-sm font-medium transition hover:bg-muted"
            href="/system-logs?type=campaign"
          >
            Campaigns
          </Link>
          <Link
            className="inline-flex h-10 items-center rounded-xl border border-border/40 bg-background/70 px-4 text-sm font-medium transition hover:bg-muted"
            href="/system-logs?type=document"
          >
            Documents
          </Link>
          <Link
            className="inline-flex h-10 items-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition hover:bg-foreground/90"
            href="/system-logs?type=knowledge"
          >
            Knowledge
          </Link>
        </>
      }
      description="Derived recent activity across chats, messages, documents, campaigns, and knowledge updates using current persisted tables."
      title="System Logs"
    >
      <div className="space-y-3">
        {filtered.map((entry) => (
          <div
            className="rounded-3xl border border-border/40 bg-card/60 px-5 py-4 shadow-[var(--shadow-card)]"
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
        ))}
      </div>
    </PageShell>
  );
}
