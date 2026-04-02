import { cn } from "@/lib/utils";
import type { TopBarProps } from "./TopBar.types";

export function TopBar({ title, subtitle, search, actions, userLabel = "User" }: TopBarProps) {
  return (
    <div className="flex w-full items-center justify-between gap-6 px-2">
      <div className="flex flex-col">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          <span className="opacity-50">Workspace</span>
          <span className="opacity-20">/</span>
          <span className="text-accent/80">{title}</span>
        </div>
        <h1 className="mt-0.5 text-lg font-bold tracking-tight text-foreground lg:text-xl">
          {title}
        </h1>
      </div>

      {search ? (
        <div className="hidden min-w-0 flex-1 px-4 lg:block max-w-2xl">
          {search}
        </div>
      ) : null}

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">{actions}</div>
        
        {/* User Profile Capsule */}
        <div className="flex items-center gap-3 rounded-full border border-border/40 bg-card/50 p-1 pr-4 shadow-card transition-all hover:border-accent/40 hover:shadow-float">
          <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-accent text-[10px] font-bold text-white shadow-glow">
            {userLabel.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-xs font-semibold text-foreground whitespace-nowrap">
            {userLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

