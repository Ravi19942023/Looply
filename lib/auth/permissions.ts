import type { UserRole } from "./types";

export function canSendCampaign(role: UserRole) {
  return role === "admin" || role === "manager";
}

export function canManageKnowledgeBase(role: UserRole) {
  return role === "admin" || role === "manager";
}

export function canDeleteAllChats(role: UserRole) {
  return role === "admin";
}

export function canRunCron(role: UserRole) {
  return role === "admin";
}
