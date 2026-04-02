"use client";

import { cloneElement, useState, useCallback } from "react";
import { CheckCircle, XCircle, Send, AlertCircle, Users, Mail, Tag, Activity, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { sendCampaign } from "@/features/campaigns/services";

type ApprovalState = "pending" | "sending" | "sent" | "failed" | "cancelled";

interface CampaignApprovalCardProps {
  campaignId: string;
  name: string;
  subject: string;
  segment: string;
  recipientCount: number | null;
  recipients?: { name: string; email: string }[] | null;
  status: string;
  className?: string;
}

export function CampaignApprovalCard({
  campaignId,
  name,
  subject,
  segment,
  recipientCount,
  recipients,
  status,
  className,
}: Readonly<CampaignApprovalCardProps>) {
  const [showRecipients, setShowRecipients] = useState(false);
  const [approvalState, setApprovalState] = useState<ApprovalState>("pending");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleApprove = useCallback(async () => {
    setApprovalState("sending");
    setErrorMessage(null);

    try {
      await sendCampaign(campaignId);
      setApprovalState("sent");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to send campaign");
      setApprovalState("failed");
    }
  }, [campaignId]);

  const handleCancel = useCallback(() => {
    setApprovalState("cancelled");
  }, []);

  const isResolved = approvalState !== "pending" && approvalState !== "sending";

  return (
    <div
      className={cn(
        "rounded-[28px] border border-border/40 bg-background/60 backdrop-blur-md p-6 shadow-xl transition-all duration-500 overflow-hidden",
        isResolved && "border-opacity-50",
        approvalState === "sent" && "border-emerald-500/30 bg-emerald-500/5",
        approvalState === "failed" && "border-destructive/30 bg-destructive/5",
        approvalState === "cancelled" && "border-muted-foreground/20 opacity-80",
        className
      )}
      role="region"
      aria-label="Campaign approval"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            "size-10 rounded-xl flex items-center justify-center text-white shadow-lg",
            approvalState === "sent" ? "bg-emerald-500 shadow-emerald-500/20" : "bg-primary shadow-primary/20"
          )}>
            <Send size={18} aria-hidden="true" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60">Authorization Required</p>
            <h3 className="text-sm font-black tracking-tight text-foreground uppercase">Campaign Ready for Dispatch</h3>
          </div>
        </div>
        {approvalState === "sending" && <Loader2 className="size-5 text-primary animate-spin" />}
      </div>

      <div className="grid gap-px bg-border/10 rounded-2xl border border-border/10 overflow-hidden mb-6">
        <DetailRow icon={<Activity />} label="Campaign Name" value={name} />
        <DetailRow icon={<Mail />} label="Email Subject" value={subject} />
        <DetailRow icon={<Tag />} label="Target Segment" value={segment} isBadge />
        <div className="relative group/recipients">
          <DetailRow 
            icon={<Users />} 
            label="Recipient Group" 
            value={recipientCount !== null ? recipientCount.toLocaleString() : "—"} 
          />
          {recipients && recipients.length > 0 && (
            <button
              type="button"
              onClick={() => setShowRecipients(!showRecipients)}
              className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-primary/10 text-[10px] font-bold text-primary hover:bg-primary/20 transition-colors"
            >
              {showRecipients ? "Hide List" : "View List"}
            </button>
          )}
        </div>
        {showRecipients && recipients && recipients.length > 0 && (
          <div className="bg-background/80 px-4 py-3 border-t border-border/10 max-h-40 overflow-y-auto animate-in slide-in-from-top-1 duration-200">
            <div className="space-y-2">
              {recipients.map((r, i) => (
                <div key={`${r.email}-${i}`} className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-foreground/80">{r.name}</span>
                  <span className="text-muted-foreground font-mono">{r.email}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <DetailRow icon={<Send />} label="Current Schema" value={status} isBadge />
      </div>

      <div className="flex flex-col gap-4">
        {(approvalState === "pending" || approvalState === "sending") && (
          <div className="flex gap-3">
            <button
              id={`campaign-approve-${campaignId}`}
              type="button"
              className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-foreground text-background text-sm font-bold tracking-tight hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
              onClick={handleApprove}
              disabled={approvalState === "sending"}
            >
              <CheckCircle size={16} aria-hidden="true" />
              {approvalState === "sending" ? "Dispatching..." : "Authorize Dispatch"}
            </button>
            <button
              id={`campaign-cancel-${campaignId}`}
              type="button"
              className="px-6 h-11 rounded-xl border border-border/60 bg-transparent text-sm font-bold tracking-tight text-foreground/70 hover:bg-muted/50 hover:text-foreground transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
              onClick={handleCancel}
              disabled={approvalState === "sending"}
            >
              <XCircle size={16} aria-hidden="true" />
              Abort
            </button>
          </div>
        )}

        {approvalState === "sent" && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 animate-in zoom-in-95 duration-500">
            <CheckCircle size={18} aria-hidden="true" />
            <p className="text-sm font-bold tracking-tight">Campaign transmission successful. Finalizing analytics...</p>
          </div>
        )}

        {approvalState === "failed" && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive animate-in zoom-in-95 duration-500">
            <AlertCircle size={18} aria-hidden="true" />
            <p className="text-sm font-bold tracking-tight">{errorMessage ?? "Transmission failure detected. Please retry or contact systems admin."}</p>
          </div>
        )}

        {approvalState === "cancelled" && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/40 border border-border/20 text-muted-foreground animate-in zoom-in-95 duration-500">
            <XCircle size={18} aria-hidden="true" />
            <p className="text-sm font-bold tracking-tight italic">Authorization session aborted by user command.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value, isBadge }: { icon: React.ReactNode, label: string, value: string, isBadge?: boolean }) {
  return (
    <div className="flex items-center justify-between p-4 bg-background/40 hover:bg-background/60 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-lg bg-muted/30 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
          {cloneElement(icon as any, { className: "size-4" })}
        </div>
        <p className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground/50">{label}</p>
      </div>
      {isBadge ? (
        <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">{value}</span>
      ) : (
        <span className="text-sm font-bold text-foreground tracking-tight">{value}</span>
      )}
    </div>
  );
}

