import type { LucideIcon } from "lucide-react";

export interface IconProps {
  icon: LucideIcon;
  size?: 16 | 18 | 20 | 24 | 32 | 40;
  color?: string;
  strokeWidth?: number;
  className?: string;
  ariaLabel?: string;
}
