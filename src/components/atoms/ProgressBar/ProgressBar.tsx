import { cn } from "@/lib/utils";
import type { ProgressBarProps } from "./ProgressBar.types";

export function ProgressBar({ value, max = 100, className }: ProgressBarProps & { className?: string }) {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div 
      aria-valuemax={max} 
      aria-valuemin={0} 
      aria-valuenow={value} 
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted/30 backdrop-blur-sm border border-border/10", className)}
      role="progressbar"
    >
      <div 
        className={cn(
          "h-full w-full flex-1 bg-primary transition-all duration-500 ease-in-out shadow-[0_0_8px_rgba(var(--primary),0.5)]",
          percentage === 0 && "opacity-0"
        )} 
        style={{ transform: `translateX(-${100 - percentage}%)` }} 
      />
    </div>
  );
}

