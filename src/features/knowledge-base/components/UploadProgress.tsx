"use client";

import { ProgressBar } from "@/components/atoms";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2 } from "lucide-react";

export function UploadProgress({
  fileName,
  progress,
  status,
  className,
}: Readonly<{
  fileName: string;
  progress: number;
  status: "uploading" | "processing" | "complete" | "error";
  className?: string;
}>) {
  const isComplete = status === "complete";
  const isError = status === "error";

  return (
    <div className={cn(
      "p-6 rounded-2xl border border-border/40 bg-background/50 backdrop-blur-sm shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-2",
      isComplete && "border-green-500/20 bg-green-500/5",
      isError && "border-destructive/20 bg-destructive/5",
      className
    )}>
      <div className="flex flex-col gap-1">
        <span className={cn(
          "text-[10px] font-bold uppercase tracking-wider",
          isComplete ? "text-green-600" : isError ? "text-destructive" : "text-muted-foreground/70"
        )}>
          {isComplete ? "Upload Complete" : isError ? "Upload Failed" : "Uploading File"}
        </span>
        <strong className="text-sm font-semibold text-foreground/90 truncate block">{fileName}</strong>
      </div>
      <ProgressBar value={progress} className="h-1.5" />
      <div className="flex justify-between items-center text-[10px] font-medium text-muted-foreground/60">
        <span>{progress.toFixed(0)}% complete</span>
        <span className="flex items-center gap-1.5">
          {isComplete ? (
            <>
              <CheckCircle2 className="size-3 text-green-600" />
              <span className="text-green-600">Done</span>
            </>
          ) : isError ? (
            "Failed"
          ) : (
            <>
              <Loader2 className="size-3 animate-spin" />
              Processing...
            </>
          )}
        </span>
      </div>
    </div>
  );
}
