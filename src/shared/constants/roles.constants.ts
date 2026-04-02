export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  ANALYST: "analyst",
  VIEWER: "viewer",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
