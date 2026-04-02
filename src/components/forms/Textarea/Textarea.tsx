import { cn } from "@/lib/utils";
import type { TextareaProps } from "./Textarea.types";

export function Textarea({ id, label, error, className, ...props }: TextareaProps & { className?: string }) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={cn("space-y-1.5", className)}>
      <label 
        htmlFor={inputId}
        className="text-sm font-medium text-foreground/80 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
      </label>
      <textarea
        {...props}
        id={inputId}
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border border-border/40 bg-background/50 px-3 py-2 text-sm ring-offset-background transition-all placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          "hover:border-border/60 backdrop-blur-sm shadow-sm resize-none",
          error && "border-destructive focus-visible:ring-destructive"
        )}
      />
      {error && (
        <p className="text-xs font-medium text-destructive transition-all animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
}

