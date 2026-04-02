import type { ReactNode } from "react";

export interface AppShellProps {
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
  chatSlot?: ReactNode;
  customSidebar?: ReactNode;
  isFullBleed?: boolean;
  hideHeader?: boolean;
}

