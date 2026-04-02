"use client";

import { useEffect, useState } from "react";

import { ApiClientError } from "@/lib/api";

import { fetchAnalyticsSummary } from "../services";
import type { AnalyticsSummary } from "../types";

export function useAnalyticsSummary(period: string) {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSummary() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchAnalyticsSummary(period);
        if (active) {
          setSummary(result);
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
          setError("Unable to load analytics.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadSummary();

    return () => {
      active = false;
    };
  }, [period]);

  return { summary, isLoading, error };
}
