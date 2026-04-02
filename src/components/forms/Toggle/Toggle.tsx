import { cn } from "@/lib/utils";
import type { ToggleProps } from "./Toggle.types";

export function Toggle({ checked, onCheckedChange, label, disabled, className }: ToggleProps & { className?: string }) {
  return (
    <label className={cn(
      "inline-flex items-center gap-3 cursor-pointer group select-none",
      disabled && "cursor-not-allowed opacity-50",
      className
    )}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          className="sr-only peer"
          onChange={(event) => onCheckedChange(event.target.checked)}
        />
        <div className={cn(
          "h-6 w-11 rounded-full bg-muted/40 border border-border/40 transition-all duration-300 backdrop-blur-sm peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
          "peer-checked:bg-primary peer-checked:border-primary/20"
        )}>
          <div className={cn(
            "absolute left-1 top-1 size-4 rounded-full bg-background shadow-md transition-all duration-300 ease-spring",
            "peer-checked:translate-x-5",
            "group-active:scale-95"
          )} />
        </div>
      </div>
      <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">{label}</span>
    </label>
  );
}

