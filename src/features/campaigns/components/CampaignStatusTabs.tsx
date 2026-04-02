"use client";

import { Tabs } from "@/components/forms";

import { CAMPAIGN_STATUS_TABS } from "../constants";
import type { CampaignRecord } from "../types";

export function CampaignStatusTabs({
  campaigns,
  value,
  onChange,
}: Readonly<{
  campaigns: CampaignRecord[];
  value: string;
  onChange: (nextValue: string) => void;
}>) {
  return (
    <Tabs
      ariaLabel="Campaign status tabs"
      tabs={CAMPAIGN_STATUS_TABS.map((tab) => ({
        label: tab.label,
        value: tab.value,
        badge:
          tab.value === "all"
            ? campaigns.length
            : campaigns.filter((campaign) => campaign.status === tab.value).length,
      }))}
      value={value}
      onValueChange={onChange}
    />
  );
}
