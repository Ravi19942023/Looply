"use client";

import { SearchInput, Select, Tabs } from "@/components/forms";
import { CUSTOMER_SORT_OPTIONS, CUSTOMER_VIEWS } from "../constants";
import type { CustomerListParams } from "../types";
import { cn } from "@/lib/utils";
import type { PaginationMeta } from "@/shared/types";

export function CustomerFilterBar({
  value,
  totalCount,
  pagination,
  onChange,
  className,
}: Readonly<{
  value: CustomerListParams;
  totalCount: number;
  pagination: PaginationMeta | null;
  onChange: (nextValue: CustomerListParams) => void;
  className?: string;
}>) {
  function getTabBadge(view: CustomerListParams["view"]): number {
    if (view === "all" && pagination) {
      return pagination.total;
    }
    return totalCount;
  }

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Tabs
          ariaLabel="Customer views"
          tabs={CUSTOMER_VIEWS.map((item) => ({
            label: item.label,
            value: item.value,
            badge: getTabBadge(item.value),
          }))}
          value={value.view}
          onValueChange={(nextView) =>
            onChange({
              ...value,
              view: nextView as CustomerListParams["view"],
              page: 1,
            })
          }
        />

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex-1 sm:w-56">
            <SearchInput
              className="bg-background/50 backdrop-blur-sm"
              ariaLabel="Search customers"
              onValueChange={(query) =>
                onChange({
                  ...value,
                  query,
                  page: 1,
                })
              }
              placeholder="Search by name or email"
              value={value.query}
            />
          </div>
          <div className="w-36 shrink-0">
            <Select
              placeholder="Sort by"
              className="bg-background/50 backdrop-blur-sm"
              options={CUSTOMER_SORT_OPTIONS.map((option) => ({
                label: option.label,
                value: option.value,
              }))}
              value={value.sort}
              onChange={(sort) =>
                onChange({
                  ...value,
                  sort: String(sort) as CustomerListParams["sort"],
                })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
