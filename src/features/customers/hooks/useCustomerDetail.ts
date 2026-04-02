"use client";

import { useEffect, useState } from "react";

import { ApiClientError } from "@/lib/api";

import { fetchCustomerLtv } from "../services";
import type { CustomerSummary } from "../types";

export function useCustomerDetail(customerId: string | null) {
  const [customer, setCustomer] = useState<CustomerSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) {
      setCustomer(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let active = true;

    async function loadCustomer() {
      if (!customerId) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const nextCustomer = await fetchCustomerLtv(customerId);

        if (active) {
          setCustomer(nextCustomer);
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
          setError("Unable to load customer details.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadCustomer();

    return () => {
      active = false;
    };
  }, [customerId]);

  return {
    customer,
    isLoading,
    error,
  };
}
