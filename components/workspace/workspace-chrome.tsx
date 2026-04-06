"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { DataStreamProvider } from "@/components/chat/data-stream-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { AuthUser } from "@/lib/auth/types";
import { WorkspaceSidebar } from "./workspace-sidebar";

export function WorkspaceChrome({
  children,
  defaultSidebarOpen,
  user,
}: {
  children: ReactNode;
  defaultSidebarOpen: boolean;
  user: AuthUser;
}) {
  return (
    <DataStreamProvider>
      <SidebarProvider defaultOpen={defaultSidebarOpen}>
        <div className="flex h-dvh w-full overflow-hidden bg-sidebar">
          <WorkspaceSidebar user={user} />
          <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-sidebar">
            <Toaster
              position="top-center"
              theme="system"
              toastOptions={{
                className:
                  "!bg-card !text-foreground !border-border/50 !shadow-[var(--shadow-float)]",
              }}
            />
            {children}
          </main>
        </div>
      </SidebarProvider>
    </DataStreamProvider>
  );
}
