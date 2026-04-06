"use server";

import { cookies } from "next/headers";
import type { z } from "zod";

import {
  type AuthCredentials,
  authenticateCredentials,
  authFormSchema,
  registerCredentials,
} from "@/lib/auth/credentials";
import { setAuthCookies } from "@/lib/auth/server";

const invalidCredentialsMessage = "Invalid email or password.";
const genericValidationMessage = "Please correct the highlighted fields.";

type AuthFieldErrors = Partial<Record<"email" | "password", string>>;

export type LoginActionState = {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
  message?: string;
  fieldErrors?: AuthFieldErrors;
  redirectTo?: string;
};

function getFieldErrors(error: z.ZodError<AuthCredentials>): AuthFieldErrors {
  const flattened = error.flatten().fieldErrors;

  return {
    email: flattened.email?.[0],
    password: flattened.password?.[0],
  };
}

function validateAuthFormData(formData: FormData):
  | { success: true; data: AuthCredentials }
  | {
      success: false;
      state: Pick<LoginActionState, "status" | "message" | "fieldErrors">;
    } {
  const result = authFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    state: {
      status: "invalid_data",
      message: genericValidationMessage,
      fieldErrors: getFieldErrors(result.error),
    },
  };
}

export const login = async (
  _: LoginActionState,
  formData: FormData
): Promise<LoginActionState> => {
  try {
    const validationResult = validateAuthFormData(formData);

    if (!validationResult.success) {
      return validationResult.state;
    }

    const validatedData = validationResult.data;
    const authResult = await authenticateCredentials(validatedData);

    if (!authResult) {
      return {
        status: "failed",
        message: invalidCredentialsMessage,
      };
    }

    const cookieStore = await cookies();
    setAuthCookies(cookieStore, authResult.tokens);

    const redirectValue = formData.get("redirectUrl");
    const redirectTo =
      typeof redirectValue === "string" &&
      redirectValue.startsWith("/") &&
      !redirectValue.startsWith("//")
        ? redirectValue
        : "/";

    return { status: "success", redirectTo };
  } catch {
    return {
      status: "failed",
      message: "Unable to sign in right now. Please try again.",
    };
  }
};

export type RegisterActionState = {
  status:
    | "idle"
    | "in_progress"
    | "success"
    | "failed"
    | "user_exists"
    | "invalid_data";
  message?: string;
  fieldErrors?: AuthFieldErrors;
};

export const register = async (
  _: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> => {
  try {
    const validationResult = validateAuthFormData(formData);

    if (!validationResult.success) {
      return validationResult.state;
    }

    const validatedData = validationResult.data;
    const registerResult = await registerCredentials(validatedData);

    if ("error" in registerResult && registerResult.error === "user_exists") {
      return {
        status: "user_exists",
        message: "An account with this email already exists.",
        fieldErrors: {
          email: "Email already in use.",
        },
      } satisfies RegisterActionState;
    }

    const cookieStore = await cookies();
    if ("tokens" in registerResult) {
      setAuthCookies(cookieStore, registerResult.tokens);
    }

    return { status: "success" };
  } catch {
    return {
      status: "failed",
      message: "Unable to create your account right now.",
    };
  }
};
