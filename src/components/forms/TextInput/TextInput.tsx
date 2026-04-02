import { cn } from "@/lib/utils";
import type { TextInputProps } from "./TextInput.types";

export function TextInput({
  id,
  label,
  error,
  helperText,
  size = "md",
  leftIcon,
  rightIcon,
  className,
  ...props
}: TextInputProps & { className?: string }) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-") ?? "input";
  const helperId = helperText ? `${inputId}-helper` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label 
        htmlFor={inputId}
        className="text-sm font-medium text-foreground/80 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
      </label>
      <div className="relative group">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
            {leftIcon}
          </div>
        )}
        <input
          {...props}
          id={inputId}
          aria-describedby={errorId ?? helperId}
          className={cn(
            "flex w-full rounded-xl border border-border/40 bg-background/50 px-3 py-2 text-sm ring-offset-background transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            size === "sm" && "h-8 px-2 text-xs",
            size === "md" && "h-10",
            size === "lg" && "h-12 text-base",
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            error && "border-destructive focus-visible:ring-destructive",
            "hover:border-border/60 backdrop-blur-sm shadow-sm"
          )}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
            {rightIcon}
          </div>
        )}
      </div>
      {error ? (
        <p id={errorId} className="text-xs font-medium text-destructive transition-all animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-muted-foreground/60 leading-relaxed italic">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

