import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { CheckboxProps } from "./Checkbox.types";

export function Checkbox({ checked, onCheckedChange, label, disabled, className }: CheckboxProps & { className?: string }) {
  return (
    <label className={cn(
      "inline-flex items-center gap-2.5 cursor-pointer group select-none",
      disabled && "cursor-not-allowed opacity-50",
      className
    )}>
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          className="sr-only peer"
          onChange={(event) => onCheckedChange(event.target.checked)}
        />
        <div className={cn(
          "size-5 rounded-md border border-border/40 bg-background/50 transition-all duration-200 backdrop-blur-sm shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
          "peer-checked:bg-primary peer-checked:border-primary group-hover:border-border/60",
          "flex items-center justify-center"
        )}>
          {checked && (
            <Check className="size-3.5 text-primary-foreground animate-in zoom-in-50 duration-200" strokeWidth={3} />
          )}
        </div>
      </div>
      <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
        {label}
      </span>
    </label>
  );
}

