import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SpinnerProps } from "./Spinner.types";

export function Spinner({ size = 16, className }: SpinnerProps & { className?: string }) {
  return (
    <Loader2
      aria-label="Loading"
      className={cn("animate-spin text-muted-foreground", className)}
      role="status"
      size={size}
    />
  );
}

