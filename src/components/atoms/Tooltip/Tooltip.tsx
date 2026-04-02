"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import type { TooltipProps } from "./Tooltip.types";

export function Tooltip({ content, children }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const id = useId();

  return (
    <div
      aria-describedby={isOpen ? id : undefined}
      className="relative inline-flex items-center"
      onBlur={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {children}
      {isOpen ? (
        <div
          className={cn(
            "absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-1 duration-200",
            "rounded-lg border border-border/40 bg-card/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-float backdrop-blur-md"
          )}
          id={id}
          role="tooltip"
        >
          {content}
          <div className="absolute top-full left-1/2 -ml-1 border-4 border-transparent border-t-card/95" />
        </div>
      ) : null}
    </div>
  );
}

