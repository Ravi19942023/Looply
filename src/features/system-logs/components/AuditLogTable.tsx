"use client";

import { DataTable } from "@/components/data-display/DataTable";

type AuditRow = {
  id: string;
  event: string;
  actorEmail: string | null;
  actorId: string;
  resourceType: string | null;
  resourceId: string | null;
  ipAddress: string | null;
  timestamp: Date;
};

interface AuditLogTableProps {
  data: AuditRow[];
}

export function AuditLogTable({ data }: AuditLogTableProps) {
  return (
    <DataTable
      columns={[
        {
          key: "event",
          header: "Event",
          render: (row) => <span className="font-medium">{row.event}</span>,
        },
        {
          key: "actorEmail",
          header: "Actor",
          render: (row) => row.actorEmail || <span className="text-muted-foreground text-xs">{row.actorId}</span>,
        },
        {
          key: "resource",
          header: "Resource",
          render: (row) => (
            <div className="flex flex-col">
              <span>{row.resourceType || "-"}</span>
              {row.resourceId && (
                <span className="text-xs text-muted-foreground font-mono">
                  {row.resourceId}
                </span>
              )}
            </div>
          ),
        },
        {
          key: "ipAddress",
          header: "IP Address",
          render: (row) => row.ipAddress || "-",
        },
        {
          key: "timestamp",
          header: "Timestamp",
          render: (row) => (
            <span className="text-muted-foreground whitespace-nowrap">
              {new Date(row.timestamp).toLocaleString()}
            </span>
          ),
          align: "right",
        },
      ]}
      data={data}
      getRowId={(row) => row.id}
      emptyState={
        <div className="p-8 text-center text-muted-foreground border border-border/40 rounded-2xl bg-card/30 backdrop-blur-sm">
          No audit events found.
        </div>
      }
    />
  );
}
