import { cn } from "@/lib/utils";
import type { DividerProps } from "./Divider.types";

export function Divider({ orientation = "horizontal", className }: DividerProps & { className?: string }) {
  return (
    <div
      className={cn(
        "shrink-0 bg-border/40",
        orientation === "horizontal" ? "h-[1px] w-full my-4" : "h-full w-[1px] mx-4",
        className
      )}
    />
  );
}

