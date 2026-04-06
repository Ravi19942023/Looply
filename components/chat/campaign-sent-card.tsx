"use client";

import { CheckCircle2Icon, SendIcon, UsersIcon } from "lucide-react";

export function CampaignSentCard({
  name,
  recipientCount,
  recipients,
  segment,
  sentAt,
  subject,
}: Readonly<{
  name: string;
  recipientCount: number | null;
  recipients?: { name: string; email: string }[] | null;
  segment: string;
  sentAt?: Date | string | null;
  subject: string;
}>) {
  const sentLabel = sentAt
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(sentAt))
    : "Just now";

  return (
    <div className="w-full max-w-[520px] overflow-hidden rounded-[28px] border border-emerald-500/20 bg-emerald-500/5 p-5 shadow-xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg">
            <SendIcon size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700/70">
              Campaign Sent
            </div>
            <div className="text-sm font-bold tracking-tight">
              Delivery completed successfully
            </div>
          </div>
        </div>
        <div className="text-right text-[12px] text-muted-foreground">
          {sentLabel}
        </div>
      </div>

      <div className="space-y-2 rounded-2xl border border-border/30 bg-background/70 p-4 text-sm">
        <div>
          <strong>Name:</strong> {name}
        </div>
        <div>
          <strong>Subject:</strong> {subject}
        </div>
        <div>
          <strong>Segment:</strong> {segment}
        </div>
        <div>
          <strong>Recipients:</strong> {recipientCount ?? 0}
        </div>
      </div>

      {recipients && recipients.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-border/30 bg-background/60 p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
            <UsersIcon size={14} />
            Recipient Preview
          </div>
          <div className="space-y-2">
            {recipients.slice(0, 6).map((recipient) => (
              <div
                className="flex items-center justify-between gap-3 text-sm"
                key={recipient.email}
              >
                <span className="truncate">{recipient.name}</span>
                <span className="truncate font-mono text-[12px] text-muted-foreground">
                  {recipient.email}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700">
        <CheckCircle2Icon className="size-4" />
        The campaign has been authorized and sent.
      </div>
    </div>
  );
}
