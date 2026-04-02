"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Card } from "@/components/atoms";
import { PageHeader } from "@/components/data-display";
import { featureShellStyles } from "@/features/shared/FeatureShell";

const items = [
  { href: "/settings/profile", label: "Profile Information" },
  { href: "/settings/team", label: "Team Management" },
  { href: "/settings/integrations", label: "Connected Apps" },
] as const;

export function SettingsLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <div className={featureShellStyles.page}>
      <PageHeader
        description="Review and update your profile, team permissions, and third-party integrations."
        eyebrow="Settings"
        title="Settings & Workspace"
      />
      
      <div className={featureShellStyles.grid}>
        <aside className="space-y-4">
          <Card className="p-2 overflow-hidden bg-muted/20 backdrop-blur-sm">
            <div className={featureShellStyles.stack}>
              <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                General
              </p>
              {items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </Card>
        </aside>
        
        <main className="animate-fade-in transition-all">
          {children}
        </main>
      </div>
    </div>
  );
}

