"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs } from "@/components/forms/Tabs";

export function TelemetryTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentTab = searchParams.get("tab") || "chats";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", value);
    params.delete("page"); // Reset pagination on tab change
    router.replace(`${pathname}?${params.toString()}` as any);
  };

  return (
    <Tabs
      tabs={[
        { label: "Chat Sessions", value: "chats" },
        { label: "RAG Operations", value: "rag" },
      ]}
      value={currentTab}
      onValueChange={handleTabChange}
      ariaLabel="Telemetry View Tabs"
      className="mb-6"
    />
  );
}
