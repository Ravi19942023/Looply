import type { ReactNode } from "react";

export interface SidebarItem {
  href: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
}

export interface SidebarProps {
  brand: string;
  items: SidebarItem[];
  footer?: ReactNode;
}
