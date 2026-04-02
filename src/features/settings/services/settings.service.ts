import { API_ENDPOINTS } from "@/shared/constants";
import { apiClient } from "@/lib/api";

import type { IntegrationSummary, ProfileSettings, TeamMember } from "../types";

export async function fetchProfile(): Promise<ProfileSettings> {
  return apiClient<ProfileSettings>(API_ENDPOINTS.SETTINGS_PROFILE);
}

export async function updateProfile(payload: {
  name: string;
  currentPassword?: string;
  newPassword?: string;
}): Promise<ProfileSettings> {
  return apiClient<ProfileSettings>(API_ENDPOINTS.SETTINGS_PROFILE, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function fetchTeam(): Promise<TeamMember[]> {
  return apiClient<TeamMember[]>(API_ENDPOINTS.SETTINGS_TEAM);
}

export async function inviteMember(payload: {
  name: string;
  email: string;
  role: string;
}): Promise<TeamMember> {
  return apiClient<TeamMember>(API_ENDPOINTS.SETTINGS_TEAM, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateMemberRole(id: string, role: string): Promise<TeamMember> {
  return apiClient<TeamMember>(API_ENDPOINTS.SETTINGS_TEAM_MEMBER(id), {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function removeMember(id: string): Promise<void> {
  await apiClient<void>(API_ENDPOINTS.SETTINGS_TEAM_MEMBER(id), {
    method: "DELETE",
  });
}

export async function fetchIntegrations(): Promise<IntegrationSummary[]> {
  return apiClient<IntegrationSummary[]>(API_ENDPOINTS.SETTINGS_INTEGRATIONS);
}
