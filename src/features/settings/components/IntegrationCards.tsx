"use client";

import { Badge, Button, Card } from "@/components/atoms";
import { useIntegrations } from "../hooks";

export function IntegrationCards() {
  const { integrations, isLoading, error } = useIntegrations();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {error && <p className="col-span-full text-center py-8 text-destructive text-sm font-medium">{error}</p>}
      {isLoading && <p className="col-span-full text-center py-8 text-muted-foreground animate-pulse text-sm">Loading integrations...</p>}
      {integrations.map((integration) => (
        <Card key={integration.id} description={integration.provider} title={`${integration.id.toUpperCase()} provider`} padded>
          <div className="flex items-center justify-between mt-auto pt-6 border-t border-border/40">
            <Badge
              label={integration.status}
              status={integration.status === "active" ? "completed" : "pending"}
            />
            <Button size="sm" variant="outline" disabled>
              Configure
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

