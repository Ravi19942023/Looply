import { ToastProvider } from "@/components/feedback";
import type { ReactNode } from "react";
import { DashboardShell } from "./DashboardShell";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <ToastProvider>
      <DashboardShell>{children}</DashboardShell>
    </ToastProvider>
  );
}

