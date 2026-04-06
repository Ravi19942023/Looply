"use client";

import Link from "next/link";
import type { SearchParams } from "@/lib/pagination";
import { cn } from "@/lib/utils";

function buildTabHref(
  searchParams: SearchParams,
  tab: "chats" | "rag",
  pageSize: number
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value == null || key === "tab" || key === "page" || key === "days") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item);
      }
      continue;
    }

    params.set(key, value);
  }

  params.set("tab", tab);
  params.set("page", "1");
  params.set("pageSize", String(pageSize));

  return `/telemetry?${params.toString()}`;
}

export function TelemetryTabs({
  currentTab,
  pageSize,
  searchParams,
}: {
  currentTab: "chats" | "rag";
  pageSize: number;
  searchParams: SearchParams;
}) {
  const tabs = [
    { label: "Chat Sessions", value: "chats" as const },
    { label: "RAG Operations", value: "rag" as const },
  ];

  return (
    <div className="flex items-center border-b border-border/30">
      {tabs.map((tab) => (
        <Link
          className={cn(
            "relative px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] transition-colors",
            currentTab === tab.value
              ? "text-foreground after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:bg-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          href={buildTabHref(searchParams, tab.value, pageSize)}
          key={tab.value}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
