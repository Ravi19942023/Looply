import type { Role } from "@/shared/constants";

export interface ProfileSettings {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface IntegrationSummary {
  id: "ai" | "email" | "storage";
  provider: string;
  status: "active" | "inactive";
}

export interface UpdateProfileInput {
  name: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface InviteMemberInput {
  name: string;
  email: string;
  role: Role;
}
