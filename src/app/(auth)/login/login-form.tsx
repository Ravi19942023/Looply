"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Button } from "@/components/atoms";
import { TextInput } from "@/components/forms";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";

export function LoginForm({ className }: { className?: string }) {
  const router = useRouter();
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
    setIsSubmitting(true);

    try {
      await apiClient("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      router.push("/");
      router.refresh();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to sign in.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={cn("flex flex-col gap-5", className)} onSubmit={handleSubmit}>
      <div className="space-y-4">
        <TextInput
          label="Work Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={handleEmailChange}
          className="bg-background/50 backdrop-blur-sm"
        />
        <TextInput
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={handlePasswordChange}
          className="bg-background/50 backdrop-blur-sm"
        />
      </div>

      {error && (
        <p className="text-[11px] font-medium text-destructive animate-in fade-in slide-in-from-top-1 px-1">
          {error}
        </p>
      )}

      <div className="pt-2">
        <Button 
          fullWidth 
          isLoading={isSubmitting} 
          type="submit"
          className="h-11 rounded-xl shadow-lg shadow-primary/10 transition-all active:scale-[0.98]"
        >
          Authenticate Identity
        </Button>
      </div>
    </form>
  );
}

