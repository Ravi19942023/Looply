import { cn } from "@/lib/utils";
import type { SkeletonProps } from "./Skeleton.types";

export function Skeleton({
  width = "100%",
  height = 16,
  radius = "md",
  className,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse bg-muted/40",
        radius === "sm" && "rounded-sm",
        radius === "md" && "rounded-md",
        radius === "lg" && "rounded-lg",
        radius === "xl" && "rounded-xl",
        radius === "full" && "rounded-full",
        className
      )}
      style={{ width, height: typeof height === "number" ? `${height}px` : height, ...style }}
      {...props}
    />
  );
}

