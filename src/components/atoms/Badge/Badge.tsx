"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-all",
  {
    variants: {
      status: {
        completed: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
        sent: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
        pending: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
        processing: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
        draft: "bg-slate-500/10 text-slate-600 border border-slate-500/20",
        failed: "bg-destructive/10 text-destructive border border-destructive/20",
        cancelled: "bg-slate-500/10 text-slate-600 border border-slate-500/20",
      },
    },
    defaultVariants: {
      status: "draft",
    },
  }
);

const defaultLabels: Record<string, string> = {
  completed: "Completed",
  pending: "Pending",
  failed: "Failed",
  sent: "Sent",
  draft: "Draft",
  processing: "Processing",
  cancelled: "Cancelled",
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  status: NonNullable<VariantProps<typeof badgeVariants>["status"]>;
  label?: string;
  showDot?: boolean;
}

export function Badge({ className, status, label, showDot = true, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ status }), className)} {...props}>
      {showDot && (
        <span className={cn(
          "size-1.5 rounded-full animate-pulse",
          status === "completed" || status === "sent" ? "bg-emerald-500" :
          status === "pending" || status === "processing" ? "bg-amber-500" :
          status === "failed" ? "bg-destructive" : "bg-slate-400"
        )} />
      )}
      <span>{label ?? defaultLabels[status]}</span>
    </span>
  );
}

