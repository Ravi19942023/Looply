"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function formatValue(value: unknown) {
  if (value == null) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function ToolCard({
  children,
  className,
  defaultOpen = true,
}: Readonly<{
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
}>) {
  return (
    <details
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-sm",
        className,
      )}
      open={defaultOpen}
    >
      {children}
    </details>
  );
}

export function ToolHeader({
  description,
  isRunning,
  state,
}: Readonly<{
  description: string;
  isRunning: boolean;
  state: string;
}>) {
  const stateLabel =
    state === "output-error" || state === "error"
      ? "Failed"
      : state === "output-available" || state === "result"
        ? "Completed"
        : "Running";

  return (
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 border-b border-border/50 px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {isRunning ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
        <span>{description}</span>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
        {stateLabel}
      </span>
    </summary>
  );
}

export function ToolSection({
  label,
  value,
}: Readonly<{
  label: string;
  value: unknown;
}>) {
  const formatted = formatValue(value);
  if (!formatted) {
    return null;
  }

  return (
    <div className="space-y-2 rounded-xl border border-border/40 bg-background/60 p-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
        {label}
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs leading-5 text-foreground/85">
        {formatted}
      </pre>
    </div>
  );
}
