"use client";

import { Badge, Button, Card } from "@/components/atoms";
import type { CampaignRecord } from "../types";
import { cn } from "@/lib/utils";
import { Users, Mail } from "lucide-react";

export function CampaignCard({
  campaign,
  onSend,
  className,
}: Readonly<{
  campaign: CampaignRecord;
  onSend: (campaignId: string) => void;
  className?: string;
}>) {
  return (
    <Card 
      className={cn("group hover:ring-2 hover:ring-primary/20 transition-all duration-300", className)}
      description={`Segment: ${campaign.segment}`} 
      title={campaign.name}
    >
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <Badge
            label={campaign.status}
            status={
              campaign.status === "sent"
                ? "sent"
                : campaign.status === "failed"
                  ? "failed"
                  : campaign.status === "draft"
                    ? "draft"
                    : "pending"
            }
          />
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/60">
            <Users className="size-3" />
            <span>{campaign.recipientCount ?? 0}</span>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border/20">
          <Mail className="size-3.5 text-muted-foreground/40 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground/70 line-clamp-1 italic">
            {campaign.subject || "No subject defined"}
          </p>
        </div>

        <div className="pt-2">
          <Button
            fullWidth
            disabled={campaign.status === "sent" || campaign.status === "pending"}
            size="sm"
            variant="secondary"
            onClick={() => onSend(campaign.id)}
            className="rounded-lg h-9 bg-background/50 border-border/40 hover:bg-primary/5 hover:text-primary transition-colors"
          >
            {campaign.status === "sent" ? "Delivered" : "Dispatch Campaign"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

