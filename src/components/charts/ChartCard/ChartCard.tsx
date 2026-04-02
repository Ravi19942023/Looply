import { Card } from "@/components/atoms";

import type { ChartCardProps } from "./ChartCard.types";

export function ChartCard({ title, description, children }: ChartCardProps) {
  return (
    <Card title={title} description={description}>
      {children}
    </Card>
  );
}
