export type BadgeStatus =
  | "completed"
  | "pending"
  | "failed"
  | "sent"
  | "draft"
  | "processing"
  | "cancelled";

export interface BadgeProps {
  status: BadgeStatus;
  label?: string;
  showDot?: boolean;
}
