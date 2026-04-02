"use client";

import { memo, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import { cn } from "@/lib/utils";
import type { PaginationMeta } from "@/shared/types/api.types";

export interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  className?: string;
}

const PageButton = memo(({ 
  page, 
  isActive, 
  onClick 
}: { 
  page: number; 
  isActive: boolean; 
  onClick: (p: number) => void;
}) => {
  const handleClick = useCallback(() => onClick(page), [page, onClick]);

  return (
    <Button
      variant={isActive ? "primary" : "ghost"}
      size="icon"
      className={cn(
        "size-8 rounded-lg text-xs font-semibold",
        isActive && "shadow-sm",
      )}
      onClick={handleClick}
    >
      {page}
    </Button>
  );
});

PageButton.displayName = "PageButton";

export function Pagination({
  pagination,
  onPageChange,
  className,
}: PaginationProps) {
  const { page, totalPages, total, pageSize } = pagination;
  const fromItem = (page - 1) * pageSize + 1;
  const toItem = Math.min(page * pageSize, total);

  const pages = buildPageRange(page, totalPages);

  const handlePrevPage = useCallback(() => onPageChange(page - 1), [page, onPageChange]);
  const handleNextPage = useCallback(() => onPageChange(page + 1), [page, onPageChange]);

  const handlePageClick = useCallback((p: number) => {
    onPageChange(p);
  }, [onPageChange]);

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4", className)}>
      <p className="text-xs font-medium text-muted-foreground/60">
        Showing {fromItem}&ndash;{toItem} of {total}
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg"
          disabled={page <= 1}
          onClick={handlePrevPage}
        >
          <ChevronLeft className="size-4" />
        </Button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="size-8 flex items-center justify-center text-xs text-muted-foreground">
              &hellip;
            </span>
          ) : (
            <PageButton
              key={p}
              page={p as number}
              isActive={p === page}
              onClick={handlePageClick}
            />
          ),
        )}

        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg"
          disabled={page >= totalPages}
          onClick={handleNextPage}
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
