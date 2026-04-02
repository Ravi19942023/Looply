"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import { Button } from "@/components/atoms";
import { TextInput } from "@/components/forms";
import { login } from "@/features/auth/services";
import { useAuthStore } from "@/features/auth/store";
import { LoginFormSchema } from "@/features/auth/validators";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const setLoading = useAuthStore((state) => state.setLoading);
  const setUser = useAuthStore((state) => state.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleEmailChange(event: ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value);
  }

  function handlePasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setPassword(event.target.value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const parsed = LoginFormSchema.safeParse({ email, password });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email and password.");
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      const user = await login(parsed.data);
      setUser(user);
      router.push("/");
      router.refresh();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to sign in.";
      setError(message);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  }

  return (
    <form className="flex flex-col gap-6 w-full max-w-sm" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <TextInput
          label="Email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={handleEmailChange}
          autoComplete="email"
          required
        />
        <TextInput
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={handlePasswordChange}
          autoComplete="current-password"
          required
        />
      </div>

      {error && (
        <p className="text-xs font-medium text-destructive animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}

      <Button fullWidth isLoading={isSubmitting} type="submit" size="lg" className="mt-2">
        Sign in
      </Button>
    </form>
  );
}

