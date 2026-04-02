"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/atoms";
import { cn } from "@/lib/utils";
import type { PaginationMeta } from "@/shared/types";

export function PaginationControls({
  pagination,
  onPageChange,
  className,
}: Readonly<{
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  className?: string;
}>) {
  const { page, totalPages, total, pageSize } = pagination;
  const fromItem = (page - 1) * pageSize + 1;
  const toItem = Math.min(page * pageSize, total);

  const pages = buildPageRange(page, totalPages);

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <p className="text-xs font-medium text-muted-foreground/60">
        Showing {fromItem}&ndash;{toItem} of {total}
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="size-8 flex items-center justify-center text-xs text-muted-foreground">
              &hellip;
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "primary" : "ghost"}
              size="icon"
              className={cn(
                "size-8 rounded-lg text-xs font-semibold",
                p === page && "shadow-sm",
              )}
              onClick={() => onPageChange(p as number)}
            >
              {p}
            </Button>
          ),
        )}

        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function buildPageRange(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  if (current > 3) {
    pages.push("...");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("...");
  }

  pages.push(total);

  return pages;
}
