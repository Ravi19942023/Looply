"use client";

import { CheckCircle2Icon, LoaderCircleIcon, SparklesIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

type AssistantActivityProps = {
  className?: string;
  isLoading: boolean;
  parts?: ChatMessage["parts"];
};

type ActivityStep = {
  detail: string;
  label: string;
  status: "active" | "done";
};

const fallbackStages = [
  "Analyzing your request",
  "Reviewing chat context",
  "Choosing tools and data",
  "Drafting the response",
] as const;

const toolStateLabels: Record<string, string> = {
  "approval-requested": "Waiting for approval",
  "approval-responded": "Approval received",
  "input-available": "Running",
  "input-streaming": "Starting",
  "output-available": "Completed",
  "output-denied": "Denied",
  "output-error": "Error",
};

function formatToolName(type: string) {
  return type
    .replace(/^tool-/, "")
    .replace(/([A-Z])/g, " $1")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function AssistantActivity({
  className,
  isLoading,
  parts = [],
}: AssistantActivityProps) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setElapsedMs(0);
      return;
    }

    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 700);

    return () => {
      window.clearInterval(interval);
    };
  }, [isLoading]);

  const toolSteps = useMemo<ActivityStep[]>(() => {
    return parts
      .filter((part) => part.type.startsWith("tool-"))
      .map((part) => {
        const state = "state" in part ? String(part.state) : "input-available";
        return {
          label: formatToolName(part.type),
          detail: toolStateLabels[state] ?? "Working",
          status: state === "output-available" ? "done" : "active",
        };
      });
  }, [parts]);

  const fallbackSteps = useMemo<ActivityStep[]>(() => {
    const stageIndex = Math.min(
      fallbackStages.length - 1,
      Math.floor(elapsedMs / 2200)
    );

    return fallbackStages.slice(0, stageIndex + 1).map((label, index, all) => ({
      label,
      detail: index === all.length - 1 ? "In progress" : "Completed",
      status: index === all.length - 1 ? "active" : "done",
    }));
  }, [elapsedMs]);

  const steps = toolSteps.length > 0 ? toolSteps : fallbackSteps;

  return (
    <div
      className={cn(
        "w-[min(100%,440px)] rounded-2xl border border-border/50 bg-card/60 p-4 shadow-[var(--shadow-card)]",
        className
      )}
      data-testid="assistant-activity"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-muted/70 text-muted-foreground ring-1 ring-border/40">
            <SparklesIcon className="size-4" />
          </div>
          <div>
            <div className="font-medium text-sm">Working</div>
            <div className="text-muted-foreground text-xs">
              Live behind-the-scenes status
            </div>
          </div>
        </div>
        <div className="text-muted-foreground text-xs">
          {Math.max(1, Math.floor(elapsedMs / 1000))}s
        </div>
      </div>

      <div className="space-y-2">
        {steps.map((step) => (
          <div
            className="flex items-start gap-3 rounded-xl border border-border/30 bg-background/60 px-3 py-2.5"
            key={`${step.label}-${step.detail}`}
          >
            <div className="mt-0.5 shrink-0">
              {step.status === "done" ? (
                <CheckCircle2Icon className="size-4 text-emerald-600" />
              ) : (
                <LoaderCircleIcon className="size-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <div className="font-medium text-sm">{step.label}</div>
              <div className="text-[12px] text-muted-foreground">
                {step.detail}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
