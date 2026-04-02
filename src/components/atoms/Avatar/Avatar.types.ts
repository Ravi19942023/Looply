export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  src?: string | null;
  fallback: string;
  alt: string;
  size?: AvatarSize;
}
