"use client";

import { CheckCircle2Icon, SendIcon, UsersIcon } from "lucide-react";

export function CampaignSentCard({
  deliveredCount,
  failedCount,
  name,
  provider,
  recipientCount,
  recipients,
  segment,
  status,
  sentAt,
  subject,
}: Readonly<{
  deliveredCount: number;
  failedCount: number;
  name: string;
  provider?: string;
  recipientCount: number | null;
  recipients?: { name: string; email: string }[] | null;
  segment: string;
  status?: string;
  sentAt?: Date | string | null;
  subject: string;
}>) {
  const sentLabel = sentAt
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(sentAt))
    : "Just now";

  const statusTone =
    status === "failed"
      ? {
          border: "border-destructive/20",
          bg: "bg-destructive/5",
          icon: "bg-destructive text-white",
          text: "text-destructive",
          label: "Campaign Failed",
          summary: "No recipients were delivered successfully.",
        }
      : status === "partial"
        ? {
            border: "border-amber-500/20",
            bg: "bg-amber-500/5",
            icon: "bg-amber-500 text-white",
            text: "text-amber-700",
            label: "Campaign Partially Sent",
            summary: "Some recipients were delivered successfully.",
          }
        : {
            border: "border-emerald-500/20",
            bg: "bg-emerald-500/5",
            icon: "bg-emerald-600 text-white",
            text: "text-emerald-700",
            label: "Campaign Sent",
            summary: "Delivery completed successfully.",
          };

  return (
    <div
      className={`w-full max-w-[520px] overflow-hidden rounded-[28px] border ${statusTone.border} ${statusTone.bg} p-5 shadow-xl`}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex size-10 items-center justify-center rounded-xl ${statusTone.icon} shadow-lg`}
          >
            <SendIcon size={18} />
          </div>
          <div>
            <div
              className={`text-[10px] font-bold uppercase tracking-[0.2em] ${statusTone.text}/80`}
            >
              {statusTone.label}
            </div>
            <div className="text-sm font-bold tracking-tight">
              Provider: {provider ?? "ses"}
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
        <div>
          <strong>Delivered:</strong> {deliveredCount}
        </div>
        <div>
          <strong>Failed:</strong> {failedCount}
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

      <div
        className={`mt-4 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium ${statusTone.text} ${
          status === "failed"
            ? "bg-destructive/10"
            : status === "partial"
              ? "bg-amber-500/10"
              : "bg-emerald-500/10"
        }`}
      >
        <CheckCircle2Icon className="size-4" />
        {statusTone.summary}
      </div>
    </div>
  );
}
