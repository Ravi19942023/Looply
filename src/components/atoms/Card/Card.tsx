import { cn } from "@/lib/utils";
import type { CardProps } from "./Card.types";

export function Card({
  title,
  description,
  footer,
  padded = true,
  elevated = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-border/40 bg-background/50 backdrop-blur-sm text-card-foreground transition-all duration-300",
        "hover:border-border/60 hover:shadow-2xl hover:shadow-black/5",
        elevated && "shadow-xl shadow-black/10",
        className
      )}
      {...props}
    >
      {(title || description) && (
        <div className={cn("flex flex-col gap-1", padded ? "p-6 pb-0" : "p-4 pb-0")}>
          {title && (
            <h3 className="text-lg font-semibold tracking-tight text-foreground/90">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground/70 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}
      
      <div className={cn(padded ? "p-6" : "p-4")}>
        {children}
      </div>

      {footer && (
        <div className={cn(
          "flex items-center gap-3 border-t border-border/20",
          padded ? "p-6 pt-4" : "p-4 pt-3"
        )}>
          {footer}
        </div>
      )}
    </div>
  );
}


