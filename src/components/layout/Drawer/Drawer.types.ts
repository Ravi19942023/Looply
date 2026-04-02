import type { ReactNode } from "react";

export type DrawerPosition = "left" | "right";
export type DrawerSize = "sm" | "md" | "lg" | "xl" | "full";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  position?: DrawerPosition;
  size?: DrawerSize;
}
