import { compare } from "bcrypt-ts";
import { z } from "zod";
import { createUser, getUser } from "@/lib/db/queries";
import { createAuthSession } from "./server";
import type { AuthUser } from "./types";

export const authFormSchema = z.object({
  email: z
    .string({
      required_error: "Email is required.",
      invalid_type_error: "Email is required.",
    })
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid email address."),
  password: z
    .string({
      required_error: "Password is required.",
      invalid_type_error: "Password is required.",
    })
    .min(1, "Password is required.")
    .min(6, "Password must be at least 6 characters."),
});

export type AuthCredentials = z.infer<typeof authFormSchema>;

export async function authenticateCredentials(
  credentials: AuthCredentials
): Promise<{
  tokens: { accessToken: string; refreshToken: string };
  user: AuthUser;
} | null> {
  const users = await getUser(credentials.email);

  if (users.length === 0) {
    return null;
  }

  const [user] = users;

  if (!user?.password) {
    return null;
  }

  const passwordsMatch = await compare(credentials.password, user.password);

  if (!passwordsMatch) {
    return null;
  }

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    type: "regular",
  };

  const tokens = await createAuthSession(authUser);
  return { user: authUser, tokens };
}

export async function registerCredentials(
  credentials: AuthCredentials
): Promise<
  | { tokens: { accessToken: string; refreshToken: string }; user: AuthUser }
  | { error: "user_exists" }
> {
  const [existingUser] = await getUser(credentials.email);

  if (existingUser) {
    return { error: "user_exists" };
  }

  await createUser(credentials.email, credentials.password);
  const result = await authenticateCredentials(credentials);

  if (!result) {
    throw new Error("Failed to authenticate newly created user.");
  }

  return result;
}
