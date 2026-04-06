"use client";

import Form from "next/form";
import { useState } from "react";

import { Input } from "../ui/input";
import { Label } from "../ui/label";

type AuthField = "email" | "password";
type AuthFormErrors = Partial<Record<AuthField, string>>;

const authValidationMessages = {
  emailRequired: "Email is required.",
  emailInvalid: "Enter a valid email address.",
  passwordRequired: "Password is required.",
  passwordTooShort: "Password must be at least 6 characters.",
} as const;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(name: AuthField, value: string): string | undefined {
  if (name === "email") {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return authValidationMessages.emailRequired;
    }

    if (!emailPattern.test(trimmedValue)) {
      return authValidationMessages.emailInvalid;
    }

    return undefined;
  }

  if (!value) {
    return authValidationMessages.passwordRequired;
  }

  if (value.length < 6) {
    return authValidationMessages.passwordTooShort;
  }

  return undefined;
}

function getClientErrors(formData: FormData): AuthFormErrors {
  return {
    email: validateField("email", String(formData.get("email") ?? "")),
    password: validateField("password", String(formData.get("password") ?? "")),
  };
}

export function AuthForm({
  action,
  children,
  defaultEmail = "",
  errors,
  message,
}: {
  action: (formData: FormData) => void | Promise<void>;
  children: React.ReactNode;
  defaultEmail?: string;
  errors?: AuthFormErrors;
  message?: string;
}) {
  const [clientErrors, setClientErrors] = useState<AuthFormErrors>({});
  const [editedFields, setEditedFields] = useState<Record<AuthField, boolean>>({
    email: false,
    password: false,
  });

  const displayedErrors: AuthFormErrors = {
    email: editedFields.email ? clientErrors.email : errors?.email,
    password: editedFields.password ? clientErrors.password : errors?.password,
  };

  const updateFieldState = (name: AuthField, value: string) => {
    setEditedFields((current) => ({ ...current, [name]: true }));
    setClientErrors((current) => ({
      ...current,
      [name]: validateField(name, value),
    }));
  };

  const handleAction = async (formData: FormData) => {
    const nextErrors = getClientErrors(formData);

    setEditedFields({ email: true, password: true });
    setClientErrors(nextErrors);

    if (nextErrors.email || nextErrors.password) {
      return;
    }

    await action(formData);
  };

  return (
    <Form action={handleAction} className="flex flex-col gap-4" noValidate>
      {message ? (
        <div
          aria-live="polite"
          className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {message}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label className="font-normal text-muted-foreground" htmlFor="email">
          Email
        </Label>
        <Input
          aria-describedby={displayedErrors.email ? "email-error" : undefined}
          aria-invalid={Boolean(displayedErrors.email)}
          autoComplete="email"
          autoFocus
          className="h-10 rounded-lg border-border/50 bg-muted/50 text-sm transition-colors focus:border-foreground/20 focus:bg-muted"
          defaultValue={defaultEmail}
          id="email"
          name="email"
          onBlur={(event) =>
            updateFieldState("email", event.currentTarget.value)
          }
          onChange={(event) =>
            updateFieldState("email", event.currentTarget.value)
          }
          placeholder="you@someo.ne"
          required
          type="email"
        />
        {displayedErrors.email ? (
          <p className="text-xs text-destructive" id="email-error" role="alert">
            {displayedErrors.email}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label className="font-normal text-muted-foreground" htmlFor="password">
          Password
        </Label>
        <Input
          aria-describedby={
            displayedErrors.password ? "password-error" : undefined
          }
          aria-invalid={Boolean(displayedErrors.password)}
          autoComplete="current-password"
          className="h-10 rounded-lg border-border/50 bg-muted/50 text-sm transition-colors focus:border-foreground/20 focus:bg-muted"
          id="password"
          name="password"
          onBlur={(event) =>
            updateFieldState("password", event.currentTarget.value)
          }
          onChange={(event) =>
            updateFieldState("password", event.currentTarget.value)
          }
          placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
          required
          type="password"
        />
        {displayedErrors.password ? (
          <p
            className="text-xs text-destructive"
            id="password-error"
            role="alert"
          >
            {displayedErrors.password}
          </p>
        ) : null}
      </div>

      {children}
    </Form>
  );
}
