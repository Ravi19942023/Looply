import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "description"> {
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  padded?: boolean;
  elevated?: boolean;
}
