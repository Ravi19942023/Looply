import { z } from "zod";

import { ROLES } from "@/shared/constants";

export const UpdateProfileSchema = z
  .object({
    name: z.string().min(2).max(255),
    currentPassword: z.string().min(8).optional(),
    newPassword: z.string().min(8).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.newPassword && !value.currentPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Current password is required when changing the password.",
        path: ["currentPassword"],
      });
    }
  });

export const InviteMemberSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email(),
  role: z.enum([ROLES.ADMIN, ROLES.MANAGER, ROLES.ANALYST, ROLES.VIEWER]),
});

export const UpdateMemberRoleSchema = z.object({
  role: z.enum([ROLES.ADMIN, ROLES.MANAGER, ROLES.ANALYST, ROLES.VIEWER]),
});
