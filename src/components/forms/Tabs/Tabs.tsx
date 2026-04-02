import { cn } from "@/lib/utils";
import type { TabsProps } from "./Tabs.types";

export function Tabs({ tabs, value, onValueChange, ariaLabel, className }: TabsProps & { className?: string }) {
  return (
    <div 
      aria-label={ariaLabel} 
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-xl bg-muted/30 p-1 text-muted-foreground backdrop-blur-sm border border-border/20",
        className
      )} 
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = value === tab.value;
        return (
          <button
            key={tab.value}
            aria-selected={isActive}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
              isActive 
                ? "bg-background text-foreground shadow-sm scale-105 border border-border/40" 
                : "hover:bg-background/20 hover:text-foreground"
            )}
            role="tab"
            type="button"
            onClick={() => onValueChange(tab.value)}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span className={cn(
                "ml-2 flex size-5 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
                isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

