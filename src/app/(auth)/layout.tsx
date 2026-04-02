import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function AuthLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background selection:bg-primary/20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-from),transparent_40%)] from-primary/5 via-transparent to-transparent pointer-none" />
      
      <section className="w-full max-w-md relative z-10 space-y-8 animate-in fade-in zoom-in-95 duration-1000">
        <div className="flex flex-col items-center text-center gap-6">
          <div className="size-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-3xl font-black shadow-2xl shadow-primary/20 rotate-3 hover:rotate-0 transition-transform duration-500">
            L
          </div>
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary/60">
              Looply Intelligent Systems
            </p>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Sign in to your workspace
            </h1>
          </div>
        </div>
        
        <div className="relative">
          {children}
        </div>

        <p className="text-center text-[11px] text-muted-foreground/30 font-medium">
          Protected by Looply Security Protocol &copy; {new Date().getFullYear()}
        </p>
      </section>
    </main>
  );
}

