"use client";

import { FilePenLineIcon, SendIcon, UsersIcon } from "lucide-react";

export function CampaignDraftCard({
  name,
  recipientCount,
  recipients,
  segment,
  status,
  subject,
}: Readonly<{
  name: string;
  recipientCount: number | null;
  recipients?: { name: string; email: string }[] | null;
  segment: string;
  status: string;
  subject: string;
}>) {
  return (
    <div className="w-full max-w-[520px] overflow-hidden rounded-[28px] border border-border/40 bg-background/70 p-5 shadow-xl">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
          <FilePenLineIcon size={18} />
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
            Draft Created
          </div>
          <div className="text-sm font-bold tracking-tight">
            Campaign draft is ready
          </div>
        </div>
      </div>

      <div className="space-y-2 rounded-2xl border border-border/30 bg-muted/20 p-4 text-sm">
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
        <div>
          <strong>Status:</strong> {status}
        </div>
      </div>

      {recipients && recipients.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-border/30 bg-muted/10 p-4">
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

      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-primary/8 px-4 py-3 text-sm text-foreground/85">
        <SendIcon className="size-4 text-primary" />
        Review the draft, then authorize dispatch from the next campaign action.
      </div>
    </div>
  );
}
