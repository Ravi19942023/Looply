import type { ReactNode } from "react";
import type { NumberFormatType } from "@/shared/formatters/number";

export type KpiTone = "default" | "positive" | "warning" | "danger";
export type KpiFormatType = NumberFormatType;
export type TrendDirection = "up" | "down" | "neutral";

export interface KpiCardProps {
  label: string;
  value: string | number | null;
  previousValue?: number;
  trend?: TrendDirection;
  trendPercentage?: number;
  formatType?: KpiFormatType;
  change?: string;
  tone?: KpiTone;
  icon?: ReactNode;
  helperText?: string;
  loading?: boolean;
  error?: string | null;
  onClick?: () => void;
}
