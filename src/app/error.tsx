"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/atoms";
import { EmptyState } from "@/components/feedback";

export default function Error({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <main className="min-h-[80vh] flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-lg p-1 rounded-3xl animate-in fade-in zoom-in-95 duration-500">
        <EmptyState
          actions={
            <Button leftIcon={<RefreshCw size={16} />} onClick={reset} size="lg">
              Try again
            </Button>
          }
          description={error.message || "We encountered an unexpected error. Please try again."}
          icon={<AlertTriangle size={32} className="text-destructive mb-2" />}
          title="Something went wrong"
        />
      </div>
    </main>
  );
}

