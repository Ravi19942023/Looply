"use client";

import { useEffect, useState } from "react";

import { ApiClientError } from "@/lib/api";

import { fetchCampaigns } from "../services";
import type { CampaignRecord } from "../types";

export function useCampaigns(status: string) {
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadCampaigns() {
      setIsLoading(true);
      setError(null);

      try {
        const nextCampaigns = await fetchCampaigns(status);

        if (active) {
          setCampaigns(nextCampaigns);
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
          setError("Unable to load campaigns.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadCampaigns();

    return () => {
      active = false;
    };
  }, [status]);

  return {
    campaigns,
    setCampaigns,
    isLoading,
    error,
  };
}
