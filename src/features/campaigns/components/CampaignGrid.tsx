"use client";

import { EmptyState } from "@/components/feedback";
import type { CampaignRecord } from "../types";
import { CampaignCard } from "./CampaignCard";
import { cn } from "@/lib/utils";

export function CampaignGrid({
  campaigns,
  onSend,
  className,
}: Readonly<{
  campaigns: CampaignRecord[];
  onSend: (campaignId: string) => void;
  className?: string;
}>) {
  if (campaigns.length === 0) {
    return (
      <EmptyState
        description="Create the first campaign to populate this workspace."
        title="No campaigns yet"
      />
    );
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6", className)}>
      {campaigns.map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} onSend={onSend} />
      ))}
    </div>
  );
}

