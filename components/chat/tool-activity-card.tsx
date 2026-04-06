"use client";

import {
  CheckCircle2Icon,
  Clock3Icon,
  LoaderCircleIcon,
  ShieldAlertIcon,
  XCircleIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ToolActivityCardProps = {
  className?: string;
  detail?: string;
  state:
    | "approval-requested"
    | "approval-responded"
    | "input-available"
    | "input-streaming"
    | "output-available"
    | "output-denied"
    | "output-error";
  title: string;
};

const stateConfig = {
  "approval-requested": {
    description: "Waiting for your approval to continue",
    icon: Clock3Icon,
  },
  "approval-responded": {
    description: "Approval recorded",
    icon: CheckCircle2Icon,
  },
  "input-available": {
    description: "Running now",
    icon: LoaderCircleIcon,
  },
  "input-streaming": {
    description: "Starting now",
    icon: LoaderCircleIcon,
  },
  "output-available": {
    description: "Completed",
    icon: CheckCircle2Icon,
  },
  "output-denied": {
    description: "Request denied",
    icon: ShieldAlertIcon,
  },
  "output-error": {
    description: "Something went wrong",
    icon: XCircleIcon,
  },
} as const;

export function ToolActivityCard({
  className,
  detail,
  state,
  title,
}: ToolActivityCardProps) {
  const config = stateConfig[state];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "w-[min(100%,520px)] rounded-2xl border border-border/50 bg-card/60 p-4 shadow-[var(--shadow-card)]",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted/70 text-muted-foreground ring-1 ring-border/40">
          <Icon
            className={cn("size-4", {
              "animate-spin":
                state === "input-available" || state === "input-streaming",
            })}
          />
        </div>
        <div className="min-w-0">
          <div className="font-medium text-sm">{title}</div>
          <div className="mt-0.5 text-[12px] text-muted-foreground">
            {config.description}
          </div>
          {detail ? (
            <div className="mt-2 rounded-xl border border-border/30 bg-background/60 px-3 py-2 text-[13px] text-foreground/85">
              {detail}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
