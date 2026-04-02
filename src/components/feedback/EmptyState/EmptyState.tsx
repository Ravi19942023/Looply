import { Card } from "@/components/atoms/Card";
import { cn } from "@/lib/utils";
import type { EmptyStateProps } from "./EmptyState.types";

export function EmptyState({ title, description, icon, actions, className }: EmptyStateProps & { className?: string }) {
  return (
    <Card className={cn("flex flex-col items-center justify-center text-center p-12 bg-card/10 backdrop-blur-sm border-dashed", className)}>
      {icon ? (
        <div className="mb-6 rounded-2xl bg-muted/30 p-4 text-muted-foreground shadow-sm">
          {icon}
        </div>
      ) : null}
      <h3 className="mb-2 text-lg font-semibold text-foreground/90 tracking-tight">{title}</h3>
      <p className="mb-8 max-w-sm text-sm text-muted-foreground/80 leading-relaxed">{description}</p>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </Card>
  );
}

