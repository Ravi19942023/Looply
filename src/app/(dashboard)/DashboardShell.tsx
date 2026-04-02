"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout";
import { Sidebar } from "@/components/navigation";
import { TopBar } from "@/components/navigation";
import { SearchInput } from "@/components/forms";
import { Bot, LayoutDashboard, Megaphone, Users, FolderOpen, ChartColumn, Settings, Bell, Activity } from "lucide-react";
import type { ReactNode } from "react";

const sidebarItems = [
  { href: "/", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { href: "/assistant", label: "Looply Assistant", icon: <Bot size={16} /> },
  { href: "/telemetry", label: "Telemetry", icon: <Activity size={16} /> },
  { href: "/customers", label: "Customers", icon: <Users size={16} /> },
  { href: "/campaigns", label: "Campaigns", icon: <Megaphone size={16} /> },
  { href: "/knowledge-base", label: "Knowledge Base", icon: <FolderOpen size={16} /> },
  { href: "/system-logs", label: "System Logs", icon: <Activity size={16} /> },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAssistant = pathname?.startsWith("/assistant");

  return (
    <AppShell
      sidebar={<Sidebar brand="Operations console" items={sidebarItems} />}
      topbar={
        <TopBar
          actions={<Bell aria-hidden="true" size={18} />}
          search={<SearchInput ariaLabel="Search Looply" placeholder="Search customers, campaigns, or pages" />}
          subtitle="Operational workspace"
          title="Dashboard"
          userLabel="Looply"
        />
      }
      isFullBleed={isAssistant}
    >
      {children}
    </AppShell>
  );
}


