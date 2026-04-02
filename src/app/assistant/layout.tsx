import { DashboardShell } from "../(dashboard)/DashboardShell";
import { ToastProvider } from "@/components/feedback";

export default function AssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <DashboardShell>{children}</DashboardShell>
    </ToastProvider>
  );
}
