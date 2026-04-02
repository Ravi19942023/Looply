"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { SidebarProps } from "./Sidebar.types";

export function Sidebar({ brand, items, footer }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col bg-sidebar/50 backdrop-blur-sm p-4">
      {/* Brand Header */}
      <div className="group mb-8 flex items-center gap-4 rounded-2xl border border-border/40 bg-card p-4 transition-all hover:border-accent/40 hover:shadow-float">
        <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-lg font-bold text-white shadow-glow transition-transform group-hover:scale-105">
          L
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
            Looply AI
          </p>
          <strong className="block text-sm font-semibold tracking-tight text-foreground line-clamp-1">
            {brand}
          </strong>
        </div>
      </div>

      {/* Navigation */}
      <nav aria-label="Main navigation" className="flex-1 space-y-1.5">
        <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
          Navigation
        </p>
        <div className="space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href as Route}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-accent/10 text-accent shadow-sm"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {/* Active Indicator Dot */}
                {isActive && (
                  <span className="absolute left-[-4px] top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-accent" />
                )}
                
                {item.icon && (
                  <span className={cn(
                    "inline-flex size-5 items-center justify-center transition-colors px-1",
                    isActive ? "text-accent" : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    {item.icon}
                  </span>
                )}
                <span className="flex-1">{item.label}</span>
                
                {item.badge !== undefined && (
                  <span className="flex size-5 items-center justify-center rounded-md bg-accent/10 text-[10px] font-bold text-accent">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Sidebar Footer */}
      {footer ? (
        <div className="mt-auto border-t border-border/40 pt-6">
          {footer}
        </div>
      ) : null}
    </aside>
  );
}

