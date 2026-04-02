"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/atoms";
import { EmptyState } from "@/components/feedback";

export default function DashboardError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <EmptyState
      actions={
        <Button leftIcon={<RotateCcw size={16} />} onClick={reset}>
          Try again
        </Button>
      }
      description={error.message || "The dashboard route failed to render."}
      icon={<AlertTriangle size={32} />}
      title="Dashboard error"
    />
  );
}
