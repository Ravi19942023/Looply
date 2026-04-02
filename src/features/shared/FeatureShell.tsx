import type { ReactNode } from "react";
import { Card } from "@/components/atoms";
import { PageHeader } from "@/components/data-display";
import { EmptyState } from "@/components/feedback";

interface FeatureShellProps {
  title: string;
  eyebrow: string;
  description: string;
  icon: ReactNode;
  emptyTitle: string;
  emptyDescription: string;
}

export function FeatureShell({
  title,
  eyebrow,
  description,
  icon,
  emptyTitle,
  emptyDescription,
}: FeatureShellProps) {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader description={description} eyebrow={eyebrow} title={title} />
      <Card>
        <EmptyState description={emptyDescription} icon={icon} title={emptyTitle} />
      </Card>
    </div>
  );
}

export const featureShellStyles = {
  page: "flex flex-col gap-8",
  grid: "grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]",
  stack: "flex flex-col gap-1.5",
};

