"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useActionState, useEffect, useState } from "react";

import { AuthForm } from "@/components/chat/auth-form";
import { SubmitButton } from "@/components/chat/submit-button";
import { type LoginActionState, login } from "../actions";

function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    { status: "idle" }
  );

  useEffect(() => {
    if (state.status === "success") {
      setIsSuccessful(true);
      router.replace(state.redirectTo ?? "/");
    }
  }, [router, state.redirectTo, state.status]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    const redirectUrl = searchParams.get("redirectUrl");
    if (redirectUrl) {
      formData.set("redirectUrl", redirectUrl);
    }
    formAction(formData);
  };

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="text-sm text-muted-foreground">
        Sign in to your account to continue
      </p>
      <AuthForm
        action={handleSubmit}
        defaultEmail={email}
        errors={state.fieldErrors}
        message={state.status === "success" ? undefined : state.message}
      >
        <SubmitButton isSuccessful={isSuccessful}>Sign in</SubmitButton>
        <p className="text-center text-[13px] text-muted-foreground">
          {"No account? "}
          <Link
            className="text-foreground underline-offset-4 hover:underline"
            href="/register"
          >
            Sign up
          </Link>
        </p>
      </AuthForm>
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginScreen />
    </Suspense>
  );
}
