"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { Skeleton } from "@/components/feedback/Skeleton";
import { cn } from "@/lib/utils";
import type { DataTableProps } from "./DataTable.types";

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  getRowId,
  emptyState,
  caption,
  isLoading,
  sortConfig,
  onSort,
  selectable,
  selectedRows,
  onSelectionChange,
  onRowClick,
  className,
}: DataTableProps<T> & { className?: string }) {
  const handleRowClick = (row: T) => {
    if (onRowClick) {
      onRowClick(row);
    }
  };

  const handleHeaderClick = (key: keyof T | string, sortable?: boolean) => {
    if (!sortable || !onSort) return;

    const normalizedKey = String(key);
    const direction =
      sortConfig?.key === normalizedKey && sortConfig.direction === "asc" ? "desc" : "asc";

    onSort({
      key: normalizedKey,
      direction,
    });
  };

  const handleSelectRow = (row: T, isChecked: boolean) => {
    if (!selectable || !selectedRows || !onSelectionChange) return;

    const next = new Set(selectedRows);
    const rowId = getRowId(row);
    if (isChecked) {
      next.add(rowId);
    } else {
      next.delete(rowId);
    }
    onSelectionChange(next);
  };

  if (isLoading) {
    return (
      <div className={cn("w-full overflow-hidden rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm", className)}>
        {caption && (
          <div className="px-6 py-4 border-b border-border/40">
            <h3 className="text-sm font-semibold text-foreground/80 tracking-tight">{caption}</h3>
          </div>
        )}
        <div className="p-4 space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return emptyState ? <div className={className}>{emptyState}</div> : null;
  }

  return (
    <div className={cn("w-full overflow-hidden rounded-2xl border border-border/40 bg-card/30 backdrop-blur-md shadow-sm", className)}>
      {caption && (
        <div className="px-6 py-4 border-b border-border/40">
          <h3 className="text-sm font-semibold text-foreground/80 tracking-tight">{caption}</h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-border/40 bg-muted/30">
              {selectable && (
                <th className="px-6 py-4 font-medium text-muted-foreground w-12">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-border/40 bg-background accent-primary transition-all cursor-pointer"
                    onChange={(e) => {
                      if (!onSelectionChange) return;
                      if (e.target.checked) {
                        onSelectionChange(new Set(data.map(getRowId)));
                      } else {
                        onSelectionChange(new Set());
                      }
                    }}
                    checked={selectedRows?.size === data.length && data.length > 0}
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    "px-6 py-4 font-medium text-muted-foreground transition-colors",
                    column.sortable && "cursor-pointer hover:bg-muted/50 hover:text-foreground",
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right"
                  )}
                  style={{ width: column.width }}
                  onClick={() => handleHeaderClick(column.key, column.sortable)}
                >
                  <div className={cn(
                    "flex items-center gap-2",
                    column.align === "center" && "justify-center",
                    column.align === "right" && "justify-end"
                  )}>
                    <span className="truncate">{column.header}</span>
                    {column.sortable && (
                      <span className="shrink-0 text-muted-foreground/50">
                        {sortConfig?.key === String(column.key) ? (
                          sortConfig.direction === "asc" ? (
                            <ChevronUp className="size-3.5 text-primary" />
                          ) : (
                            <ChevronDown className="size-3.5 text-primary" />
                          )
                        ) : (
                          <ChevronsUpDown className="size-3.5" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {data.map((row, index) => {
              const id = getRowId(row);
              const isSelected = selectedRows?.has(id);
              
              return (
                <tr
                  key={id}
                  className={cn(
                    "group transition-all hover:bg-muted/30",
                    onRowClick && "cursor-pointer",
                    isSelected && "bg-primary/5 hover:bg-primary/10"
                  )}
                  onClick={() => handleRowClick(row)}
                >
                  {selectable && (
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        aria-label={`Select row ${id}`}
                        checked={isSelected ?? false}
                        type="checkbox"
                        className="size-4 rounded border-border/40 bg-background accent-primary transition-all cursor-pointer"
                        onChange={(event) => handleSelectRow(row, event.target.checked)}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={cn(
                        "px-6 py-4 text-foreground/80 group-hover:text-foreground transition-colors",
                        column.align === "center" && "text-center",
                        column.align === "right" && "text-right"
                      )}
                    >
                      {column.render ? (
                        column.render(row, index)
                      ) : (
                        <span className="line-clamp-1">
                          {typeof row[column.key as keyof T] === "object" 
                            ? JSON.stringify(row[column.key as keyof T]) 
                            : String(row[column.key as keyof T] ?? "")}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

