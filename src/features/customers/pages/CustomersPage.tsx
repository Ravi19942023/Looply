"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/data-display";
import { useDebounce } from "@/hooks";
import { CustomerFilterBar, CustomerTable } from "../components";
import { Pagination } from "@/components/data-display";
import { useCustomerList } from "../hooks";
import type { CustomerListParams, CustomerSummary } from "../types";

const defaultParams: CustomerListParams = {
  view: "all",
  query: "",
  sort: "name",
  page: 1,
};

export function CustomersPage() {
  const [params, setParams] = useState<CustomerListParams>(defaultParams);
  const debouncedQuery = useDebounce(params.query, 250);
  const listState = useCustomerList(
    useMemo(
      () => ({
        view: params.view,
        sort: params.sort,
        page: params.page,
        query: debouncedQuery,
      }),
      [params.view, params.sort, params.page, debouncedQuery],
    ),
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Search, segment, and review customer performance using the live customer endpoints."
        eyebrow="Customers"
        title="Customer Directory"
      />

      <div className="space-y-5">
        <CustomerFilterBar
          totalCount={listState.customers.length}
          pagination={listState.pagination}
          value={params}
          onChange={setParams}
        />

        {listState.error ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            {listState.error}
          </div>
        ) : null}

        <div className="animate-fade-up">
          <CustomerTable
            customers={listState.customers}
            isLoading={listState.isLoading}
          />
        </div>

        {listState.pagination && listState.pagination.totalPages > 1 ? (
          <Pagination
            pagination={listState.pagination}
            onPageChange={(page) => setParams((prev) => ({ ...prev, page }))}
          />
        ) : null}
      </div>
    </div>
  );
}
