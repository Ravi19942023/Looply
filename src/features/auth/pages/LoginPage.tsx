"use client";

import { Card } from "@/components/atoms";
import { PageHeader } from "@/components/data-display";
import { LoginForm } from "../components/LoginForm/LoginForm";
import { cn } from "@/lib/utils";

export function LoginPage({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-8 max-w-md mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700", className)}>
      <PageHeader
        description="Sign in to access customer operations, campaigns, analytics, and Looply AI."
        eyebrow="Authentication"
        title="Welcome back"
        className="text-center"
      />
      
      <Card className="p-8 bg-background/50 backdrop-blur-xl border-border/40 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative space-y-8">
          <LoginForm />
        </div>
      </Card>
      
      <p className="text-center text-xs text-muted-foreground/40 font-medium">
        By continuing, you agree to our terms of service.
      </p>
    </div>
  );
}

