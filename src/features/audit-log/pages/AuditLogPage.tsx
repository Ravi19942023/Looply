"use client";

import { useEffect, useState } from "react";

import { DataTable, PageHeader } from "@/components/data-display";
import { EmptyState } from "@/components/feedback";
import { SearchInput } from "@/components/forms";
import { apiClient, ApiClientError } from "@/lib/api";
import { cn } from "@/lib/utils";

interface AuditLogEntry extends Record<string, unknown> {
  id: string;
  actorId: string;
  event: string;
  resourceType?: string | null;
  resourceId?: string | null;
  timestamp: string;
}

const columns = [
  { key: "event", header: "Event" },
  { key: "actorId", header: "Actor" },
  { key: "resourceType", header: "Resource" },
  { key: "timestamp", header: "Timestamp" },
];

function getRowId(row: AuditLogEntry) {
  return row.id;
}

export function AuditLogPage({ className }: { className?: string }) {
  const [eventFilter, setEventFilter] = useState("");
  const [rows, setRows] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadAuditLogs() {
      setIsLoading(true);
      setError(null);

      try {
        const searchParams = new URLSearchParams({
          page: "1",
          pageSize: "20",
        });

        if (eventFilter) {
          searchParams.set("event", eventFilter);
        }

        const result = await apiClient<AuditLogEntry[]>(`/api/v1/audit?${searchParams.toString()}`);
        if (active) {
          setRows(result);
        }
      } catch (caughtError) {
        if (!active) {
          return;
        }

        if (caughtError instanceof ApiClientError) {
          setError(caughtError.message);
        } else if (caughtError instanceof Error) {
          setError(caughtError.message);
        } else {
          setError("Unable to load audit logs.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadAuditLogs();

    return () => {
      active = false;
    };
  }, [eventFilter]);

  function handleEventFilterChange(value: string) {
    setEventFilter(value);
  }

  return (
    <div className={cn("flex flex-col gap-8", className)}>
      <PageHeader
        description="Audit events from the live audit API."
        eyebrow="Audit"
        title="Audit Log"
      />

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="w-full max-w-md">
            <SearchInput
              ariaLabel="Filter audit events"
              loading={isLoading}
              onValueChange={handleEventFilterChange}
              placeholder="Filter by event"
              value={eventFilter}
              className="bg-background/50 backdrop-blur-sm"
            />
          </div>
          <p className="text-xs font-medium text-muted-foreground/60">
            {isLoading ? "Fetching logs..." : `${rows.length} entries in view`}
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-border/40 bg-background/50 backdrop-blur-sm overflow-hidden shadow-sm transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-2 duration-500">
          <DataTable
            caption="Audit records"
            columns={columns}
            data={rows}
            emptyState={
              <EmptyState
                description="No audit records matched the current filter."
                title="No audit records"
              />
            }
            getRowId={getRowId}
          />
        </div>
      </div>
    </div>
  );
}

