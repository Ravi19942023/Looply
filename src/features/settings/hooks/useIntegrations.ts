"use client";

import { useEffect, useState } from "react";

import { fetchIntegrations } from "../services";
import type { IntegrationSummary } from "../types";

export function useIntegrations() {
  const [integrations, setIntegrations] = useState<IntegrationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadIntegrations() {
      try {
        const nextIntegrations = await fetchIntegrations();
        if (active) {
          setIntegrations(nextIntegrations);
        }
      } catch (caughtError) {
        if (active) {
          setError(
            caughtError instanceof Error ? caughtError.message : "Unable to load integrations.",
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadIntegrations();

    return () => {
      active = false;
    };
  }, []);

  return {
    integrations,
    isLoading,
    error,
  };
}
