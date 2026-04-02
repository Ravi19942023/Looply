import type { ReactNode } from "react";

export interface TopBarProps {
  title: string;
  subtitle?: string;
  search?: ReactNode;
  actions?: ReactNode;
  userLabel?: string;
}
