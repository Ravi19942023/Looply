"use client";

import { useEffect, useState } from "react";

import { ApiClientError } from "@/lib/api";
import type { PaginationMeta } from "@/shared/types";

import { fetchCustomers } from "../services";
import type { CustomerListParams, CustomerSummary } from "../types";

export function useCustomerList(params: CustomerListParams) {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadCustomers() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchCustomers(params);

        if (active) {
          setCustomers(result.customers);
          setPagination(result.pagination);
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
          setError("Unable to load customers.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadCustomers();

    return () => {
      active = false;
    };
  }, [params]);

  return {
    customers,
    pagination,
    isLoading,
    error,
  };
}
