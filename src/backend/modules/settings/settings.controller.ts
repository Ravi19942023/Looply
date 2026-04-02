import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/backend/lib";

import {
  InviteMemberSchema,
  UpdateMemberRoleSchema,
  UpdateProfileSchema,
} from "./settings.schema";
import type { SettingsService } from "./settings.service";

export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  async getProfile(actorId: string): Promise<Response> {
    const profile = await this.settingsService.getProfile(actorId);

    if (!profile) {
      return errorResponse(404, "Profile not found", "NOT_FOUND");
    }

    return successResponse(200, profile);
  }

  async updateProfile(req: NextRequest, actorId: string): Promise<Response> {
    const body = await req.json().catch(() => null);
    const parsed = UpdateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(400, "Validation failed", "VALIDATION_ERROR", parsed.error.flatten());
    }

    try {
      const profile = await this.settingsService.updateProfile(actorId, parsed.data);

      if (!profile) {
        return errorResponse(404, "Profile not found", "NOT_FOUND");
      }

      return successResponse(200, profile);
    } catch (error) {
      return errorResponse(
        400,
        error instanceof Error ? error.message : "Unable to update profile",
        "VALIDATION_ERROR",
      );
    }
  }

  async listTeam(): Promise<Response> {
    return successResponse(200, await this.settingsService.listTeamMembers());
  }

  async inviteMember(req: NextRequest): Promise<Response> {
    const body = await req.json().catch(() => null);
    const parsed = InviteMemberSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(400, "Validation failed", "VALIDATION_ERROR", parsed.error.flatten());
    }

    return successResponse(201, await this.settingsService.inviteMember(parsed.data));
  }

  async updateMemberRole(req: NextRequest, id: string): Promise<Response> {
    const body = await req.json().catch(() => null);
    const parsed = UpdateMemberRoleSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(400, "Validation failed", "VALIDATION_ERROR", parsed.error.flatten());
    }

    const member = await this.settingsService.updateMemberRole(id, parsed.data.role);

    if (!member) {
      return errorResponse(404, "Team member not found", "NOT_FOUND");
    }

    return successResponse(200, member);
  }

  async removeMember(id: string): Promise<Response> {
    await this.settingsService.removeMember(id);
    return successResponse(200, { id });
  }

  async getIntegrations(): Promise<Response> {
    return successResponse(200, this.settingsService.getIntegrations());
  }
}
