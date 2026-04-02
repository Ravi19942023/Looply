import type { ReactNode } from "react";
import { SettingsLayout as SettingsFeatureLayout } from "@/features/settings";

export default function SettingsLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <SettingsFeatureLayout>{children}</SettingsFeatureLayout>;
}
