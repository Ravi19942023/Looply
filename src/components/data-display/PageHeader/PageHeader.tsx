import { cn } from "@/lib/utils";
import type { PageHeaderProps } from "./PageHeader.types";

export function PageHeader({ title, description, actions, eyebrow, className }: PageHeaderProps & { className?: string }) {
  return (
    <header className={cn("flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between mb-8", className)}>
      <div className="max-w-2xl space-y-1">
        {eyebrow ? (
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent/80">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-xl text-base text-muted-foreground leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-3">
          {actions}
        </div>
      ) : null}
    </header>
  );
}

