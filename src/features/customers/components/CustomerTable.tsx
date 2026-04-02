"use client";

import { Avatar } from "@/components/atoms";
import { Badge } from "@/components/atoms";
import { DataTable } from "@/components/data-display";
import { EmptyState } from "@/components/feedback";
import { cn } from "@/lib/utils";

import type { CustomerSummary } from "../types";

function getSegmentBadgeStatus(segment: string | null): "completed" | "pending" | "draft" | "processing" | "failed" {
  if (!segment) return "draft";
  const lower = segment.toLowerCase();
  if (lower.includes("vip") || lower.includes("premium") || lower.includes("enterprise")) return "completed";
  if (lower.includes("activ") || lower.includes("regular") || lower.includes("growth")) return "processing";
  if (lower.includes("churn") || lower.includes("at-risk") || lower.includes("at risk")) return "failed";
  if (lower.includes("new") || lower.includes("trial")) return "pending";
  return "processing";
}

function formatCurrency(value: string | number | null | undefined): string {
  if (value == null) return "---";
  const num = typeof value === "string" ? Number(value) : value;
  if (isNaN(num)) return "---";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getChurnColor(score: number | null | undefined): string {
  if (score == null) return "text-muted-foreground";
  if (score >= 70) return "text-destructive font-semibold";
  if (score >= 40) return "text-amber-600 font-medium";
  return "text-emerald-600 font-medium";
}

const columns = [
  {
    key: "name",
    header: "Customer",
    render: (row: CustomerSummary) => (
      <div className="flex items-center gap-3">
        <Avatar fallback={getInitials(row.name)} alt={row.name} size="xs" />
        <p className="text-sm font-semibold text-foreground truncate">{row.name}</p>
      </div>
    ),
  },
  {
    key: "email",
    header: "Email",
    render: (row: CustomerSummary) => (
      <span className="text-sm text-muted-foreground/80 tracking-tight">{row.email}</span>
    ),
  },
  {
    key: "phone",
    header: "Phone",
    render: (row: CustomerSummary) => (
      <span className="text-sm text-muted-foreground/80 tracking-tight">{row.phone ?? "---"}</span>
    ),
  },
  {
    key: "segment",
    header: "Segment",
    render: (row: CustomerSummary) =>
      row.segment ? (
        <Badge label={row.segment} status={getSegmentBadgeStatus(row.segment)} />
      ) : (
        <span className="text-xs text-muted-foreground/50">Unassigned</span>
      ),
  },
  {
    key: "ltv",
    header: "LTV",
    render: (row: CustomerSummary) => (
      <span className="text-sm font-semibold text-foreground/90">
        {formatCurrency(row.ltv)}
      </span>
    ),
    align: "right" as const,
  },
  {
    key: "totalRevenue",
    header: "Revenue",
    render: (row: CustomerSummary) => (
      <span className="text-sm font-semibold text-foreground/90">
        {formatCurrency(row.totalRevenue)}
      </span>
    ),
    align: "right" as const,
  },
  {
    key: "churnRiskScore",
    header: "Churn Risk",
    render: (row: CustomerSummary) => (
      <span className={cn("text-sm", getChurnColor(row.churnRiskScore))}>
        {row.churnRiskScore != null ? `${row.churnRiskScore}%` : "---"}
      </span>
    ),
    align: "right" as const,
    hideOnMobile: true,
  },
  {
    key: "lastPurchaseAt",
    header: "Last Purchase",
    render: (row: CustomerSummary) => (
      <span className="text-sm text-muted-foreground/80 lowercase tracking-widest font-black uppercase">
        {row.lastPurchaseAt ? new Date(row.lastPurchaseAt).toLocaleDateString("en-US", { 
          month: "short", 
          day: "numeric", 
          year: "numeric" 
        }) : "---"}
      </span>
    ),
    align: "right" as const,
    hideOnMobile: true,
  },
];

function getRowId(row: CustomerSummary) {
  return row.id;
}

export function CustomerTable({
  customers,
  isLoading,
}: Readonly<{
  customers: CustomerSummary[];
  isLoading: boolean;
}>) {
  return (
    <DataTable
      caption="Customers"
      columns={columns}
      data={customers}
      emptyState={
        <EmptyState
          description="No customers matched the current view."
          title="No customers found"
        />
      }
      getRowId={getRowId}
      isLoading={isLoading}
    />
  );
}
