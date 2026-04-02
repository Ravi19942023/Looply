"use client";

import { useEffect, useState } from "react";

import { ApiClientError } from "@/lib/api";

import { fetchDashboardData } from "../services";
import type { DashboardData } from "../types";

export function useDashboardData(period: string) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDashboardData() {
      setIsLoading(true);
      setError(null);

      try {
        const nextData = await fetchDashboardData(period);

        if (active) {
          setData(nextData);
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
          setError("Unable to load dashboard data.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboardData();

    return () => {
      active = false;
    };
  }, [period]);

  return {
    data,
    isLoading,
    error,
  };
}
