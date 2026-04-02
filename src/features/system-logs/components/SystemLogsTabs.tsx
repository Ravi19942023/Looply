"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs } from "@/components/forms/Tabs";

export function SystemLogsTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentTab = searchParams.get("tab") || "audit";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}` as any);
  };

  return (
    <Tabs
      tabs={[
        { label: "Audit Logs", value: "audit" },
        { label: "Tool Executions", value: "tools" },
      ]}
      value={currentTab}
      onValueChange={handleTabChange}
      ariaLabel="System Logs View Tabs"
      className="mb-6"
    />
  );
}
