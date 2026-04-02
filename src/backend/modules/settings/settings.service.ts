import { comparePassword, generateRandomPassword, hashPassword } from "@/backend/lib";
import type { Env } from "@/backend/config/env";
import type { IUserRepository } from "@/backend/modules/auth";

import type {
  IntegrationSummary,
  InviteMemberInput,
  ProfileSettings,
  TeamMember,
  UpdateProfileInput,
} from "./settings.types";

export class SettingsService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly env: Pick<Env, "EMAIL_PROVIDER">,
  ) {}

  async getProfile(actorId: string): Promise<ProfileSettings | null> {
    const user = await this.userRepository.findById(actorId);

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  async updateProfile(actorId: string, input: UpdateProfileInput): Promise<ProfileSettings | null> {
    const current = await this.userRepository.findById(actorId);

    if (!current) {
      return null;
    }

    let passwordHash: string | undefined;

    if (input.newPassword) {
      const passwordMatches = input.currentPassword
        ? await comparePassword(input.currentPassword, current.passwordHash)
        : false;

      if (!passwordMatches) {
        throw new Error("Current password is invalid.");
      }

      passwordHash = await hashPassword(input.newPassword);
    }

    const updated = await this.userRepository.updateProfile(actorId, {
      name: input.name,
      passwordHash,
    });

    if (!updated) {
      return null;
    }

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
    };
  }

  async listTeamMembers(): Promise<TeamMember[]> {
    const users = await this.userRepository.findAll();

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }));
  }

  async inviteMember(input: InviteMemberInput): Promise<TeamMember> {
    const password = generateRandomPassword();
    const passwordHash = await hashPassword(password);
    const created = await this.userRepository.create({
      name: input.name,
      email: input.email,
      role: input.role,
      passwordHash,
    });

    // In a real app, we would email this password or an invite link
    // For POC, we log it for the admin
    process.stdout.write(`MEMBER_INVITE: ${input.email} password is ${password}\n`);

    return {
      id: created.id,
      name: created.name,
      email: created.email,
      role: created.role,
    };
  }

  async updateMemberRole(id: string, role: TeamMember["role"]): Promise<TeamMember | null> {
    const updated = await this.userRepository.updateRole(id, role);

    if (!updated) {
      return null;
    }

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
    };
  }

  async removeMember(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  getIntegrations(): IntegrationSummary[] {
    return [
      {
        id: "ai",
        provider: "vercel-ai-gateway",
        status: "active",
      },
      {
        id: "email",
        provider: this.env.EMAIL_PROVIDER,
        status: this.env.EMAIL_PROVIDER ? "active" : "inactive",
      },
      {
        id: "storage",
        provider: "vercel-blob",
        status: "active",
      },
    ];
  }
}
