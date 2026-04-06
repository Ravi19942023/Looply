"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  createUrlSearchParams,
  type PaginationMeta,
  type SearchParams,
  getSearchParamValue,
} from "@/lib/pagination";
import { cn } from "@/lib/utils";

function buildPageHref(
  pathname: string,
  searchParams: SearchParams,
  page: number,
  pageSize: number
) {
  const params = createUrlSearchParams(searchParams);

  params.delete("page");
  params.delete("pageSize");

  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  const query = params.toString();
  return query.length > 0 ? `${pathname}?${query}` : pathname;
}

export function WorkspacePagination({
  className,
  emptyLabel = "No results",
  pagination,
  pathname,
  searchParams,
}: {
  className?: string;
  emptyLabel?: string;
  pagination: PaginationMeta;
  pathname: string;
  searchParams: SearchParams;
}) {
  if (pagination.total === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-2xl border border-border/40 bg-card/40 px-4 py-3 text-sm text-muted-foreground",
          className
        )}
        data-testid="workspace-pagination"
      >
        <span>{emptyLabel}</span>
      </div>
    );
  }

  const from = (pagination.page - 1) * pagination.pageSize + 1;
  const to = Math.min(pagination.page * pagination.pageSize, pagination.total);
  const previousHref = buildPageHref(
    pathname,
    searchParams,
    Math.max(1, pagination.page - 1),
    pagination.pageSize
  );
  const nextHref = buildPageHref(
    pathname,
    searchParams,
    Math.min(pagination.totalPages, pagination.page + 1),
    pagination.pageSize
  );
  const pageSize = getSearchParamValue(searchParams.pageSize);

  return (
    <div
      className={cn(
        "mt-6 flex flex-col gap-3 rounded-2xl border border-border/40 bg-card/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
      data-testid="workspace-pagination"
    >
      <div className="text-sm text-muted-foreground">
        Showing {from}-{to} of {pagination.total}
        <span className="ml-2 text-xs">
          Page {pagination.page} of {pagination.totalPages}
          {pageSize ? ` • ${pagination.pageSize} per page` : null}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {pagination.page > 1 ? (
          <Link
            className={buttonVariants({ size: "sm", variant: "outline" })}
            data-testid="pagination-prev"
            href={previousHref}
          >
            Previous
          </Link>
        ) : (
          <button
            className={buttonVariants({ size: "sm", variant: "outline" })}
            data-testid="pagination-prev"
            disabled
            type="button"
          >
            Previous
          </button>
        )}

        {pagination.page < pagination.totalPages ? (
          <Link
            className={buttonVariants({ size: "sm", variant: "outline" })}
            data-testid="pagination-next"
            href={nextHref}
          >
            Next
          </Link>
        ) : (
          <button
            className={buttonVariants({ size: "sm", variant: "outline" })}
            data-testid="pagination-next"
            disabled
            type="button"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
