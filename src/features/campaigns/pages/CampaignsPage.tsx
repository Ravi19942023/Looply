"use client";

import { useState } from "react";

import { Button } from "@/components/atoms";
import { PageHeader } from "@/components/data-display";

import { CAMPAIGN_STATUS_TABS } from "../constants";
import { CampaignGrid, CampaignStatusTabs, CampaignWizard } from "../components";
import { useCampaigns } from "../hooks";
import { createCampaign, sendCampaign } from "../services";
import type { CampaignFormState } from "../types";
import { cn } from "@/lib/utils";

export function CampaignsPage({ className }: { className?: string }) {
  const [status, setStatus] = useState<(typeof CAMPAIGN_STATUS_TABS)[number]["value"]>("all");
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { campaigns, error, isLoading, setCampaigns } = useCampaigns(status);

  async function handleSubmit(draft: CampaignFormState) {
    setIsSaving(true);

    try {
      const created = await createCampaign(draft);
      setCampaigns((current) => [created, ...current]);
      setIsWizardOpen(false);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSend(id: string) {
    const updated = await sendCampaign(id);
    setCampaigns((current) =>
      current.map((campaign) => (campaign.id === id ? { ...campaign, ...updated } : campaign)),
    );
  }

  return (
    <div className={cn("flex flex-col gap-8", className)}>
      <PageHeader
        actions={
          <Button onClick={() => setIsWizardOpen(true)} size="lg">
            Create campaign
          </Button>
        }
        description="Draft, schedule, and send campaigns using the live campaign APIs."
        eyebrow="Campaigns"
        title="Campaigns"
      />

      <div className="space-y-6">
        <CampaignStatusTabs 
          campaigns={campaigns} 
          value={status} 
          onChange={(nextStatus) => setStatus(nextStatus as typeof status)} 
        />
        
        {error && (
          <p className="text-sm font-medium text-destructive px-1">{error}</p>
        )}
        
        {isLoading && (
          <p className="text-xs font-medium text-muted-foreground/60 animate-pulse px-1">
            Loading campaigns...
          </p>
        )}

        <CampaignGrid campaigns={campaigns} onSend={(campaignId) => void handleSend(campaignId)} />
      </div>

      <CampaignWizard
        isOpen={isWizardOpen}
        isSaving={isSaving}
        onClose={() => setIsWizardOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

