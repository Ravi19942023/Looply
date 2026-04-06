"use client";

import { CheckCircle, Loader2, Send, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ApprovalState = "pending" | "sending" | "sent" | "failed" | "cancelled";

export function CampaignApprovalCard({
  campaignId,
  name,
  recipientCount,
  recipients,
  segment,
  status,
  subject,
}: Readonly<{
  campaignId: string;
  name: string;
  recipientCount: number | null;
  recipients?: { name: string; email: string }[] | null;
  segment: string;
  status: string;
  subject: string;
}>) {
  const [approvalState, setApprovalState] = useState<ApprovalState>("pending");

  const handleApprove = async () => {
    setApprovalState("sending");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/campaign/send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ campaignId }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send campaign");
      }

      setApprovalState("sent");
      toast.success("Campaign dispatched");
    } catch (error) {
      setApprovalState("failed");
      toast.error(
        error instanceof Error ? error.message : "Failed to send campaign"
      );
    }
  };

  return (
    <div
      className={cn(
        "my-2 w-full max-w-[520px] overflow-hidden rounded-[28px] border border-border/40 bg-background/70 p-5 shadow-xl",
        approvalState === "sent" && "border-emerald-500/30 bg-emerald-500/5",
        approvalState === "failed" && "border-destructive/30 bg-destructive/5"
      )}
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <Send size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
              Authorization Required
            </div>
            <div className="text-sm font-bold tracking-tight">
              Campaign Ready for Dispatch
            </div>
          </div>
        </div>
        {approvalState === "sending" ? (
          <Loader2 className="size-4 animate-spin text-primary" />
        ) : null}
      </div>

      <div className="mb-5 space-y-2 rounded-2xl border border-border/30 bg-muted/20 p-4 text-sm">
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
        {recipients && recipients.length > 0 ? (
          <div className="pt-2">
            <div className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
              Recipient Preview
            </div>
            <div className="max-h-32 space-y-1 overflow-y-auto text-xs">
              {recipients.map((recipient) => (
                <div
                  className="flex items-center justify-between gap-3"
                  key={recipient.email}
                >
                  <span>{recipient.name}</span>
                  <span className="font-mono text-muted-foreground">
                    {recipient.email}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {approvalState === "pending" || approvalState === "sending" ? (
        <div className="flex gap-3">
          <button
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-bold text-background transition hover:opacity-90 disabled:opacity-50"
            disabled={approvalState === "sending"}
            onClick={() => {
              handleApprove().catch(() => undefined);
            }}
            type="button"
          >
            <CheckCircle size={16} />
            {approvalState === "sending"
              ? "Dispatching..."
              : "Authorize Dispatch"}
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/50 px-4 py-3 text-sm font-bold text-foreground/70 transition hover:bg-muted/50"
            disabled={approvalState === "sending"}
            onClick={() => setApprovalState("cancelled")}
            type="button"
          >
            <XCircle size={16} />
            Abort
          </button>
        </div>
      ) : null}

      {approvalState === "sent" ? (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-600">
          <CheckCircle size={16} />
          Campaign transmission successful.
        </div>
      ) : null}

      {approvalState === "cancelled" ? (
        <div className="rounded-xl bg-muted/40 px-4 py-3 text-sm font-bold text-muted-foreground">
          Authorization session aborted.
        </div>
      ) : null}
    </div>
  );
}
