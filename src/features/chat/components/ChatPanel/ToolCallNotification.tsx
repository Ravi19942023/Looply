"use client";

import {
  CheckCircle2,
  Loader2,
  Search,
  Sparkles,
  TriangleAlert,
  WandSparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  createCampaign: "Drafting campaign",
  createDocument: "Creating artifact",
  getAnalyticsSummary: "Analyzing performance",
  getCampaignById: "Fetching campaign",
  getChurnRiskCustomers: "Finding churn risk customers",
  getCustomerLTV: "Calculating customer value",
  getTopCustomers: "Fetching top customers",
  listCampaigns: "Listing campaigns",
  recallUserContext: "Recalling context",
  requestSuggestions: "Requesting suggestions",
  retrieveKnowledgeContext: "Searching knowledge base",
  searchCustomers: "Searching customers",
  sendCampaign: "Preparing campaign approval",
  storeUserPreference: "Saving preference",
  updateDocument: "Updating artifact",
};

function getStateMeta(state: string) {
  if (state === "output-error" || state === "error") {
    return {
      badgeClass: "border-rose-500/15 bg-rose-500/8 text-rose-200",
      icon: TriangleAlert,
      iconClass: "text-rose-300",
      inlineClass: "text-rose-300",
      label: "Needs attention",
      showBadge: true,
    };
  }

  if (state === "output-available" || state === "result") {
    return {
      badgeClass: "",
      icon: CheckCircle2,
      iconClass: "text-emerald-400/90",
      inlineClass: "text-muted-foreground/55",
      label: "Completed",
      showBadge: false,
    };
  }

  return {
    badgeClass: "border-primary/15 bg-primary/8 text-primary/90",
    icon: Loader2,
    iconClass: "animate-spin text-primary/90",
    inlineClass: "text-primary/90",
    label: "Working",
    showBadge: true,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function summarizeTool(label: string, input?: unknown, output?: unknown) {
  const inputRecord = asRecord(input);
  const outputRecord = asRecord(output);

  if (label === "createCampaign") {
    const campaign = outputRecord;
    const recipientCount = campaign?.recipientCount;
    const segment = campaign?.segment;
    const name = campaign?.name;
    return name || recipientCount || segment
      ? `${name ? String(name) : "Draft campaign"}${segment ? ` for ${String(segment)}` : ""}${typeof recipientCount === "number" ? ` - ${recipientCount} recipients` : ""}`
      : "Campaign draft prepared.";
  }

  if (label === "listCampaigns") {
    return Array.isArray(output) ? `${output.length} campaign${output.length === 1 ? "" : "s"} found.` : "Campaign list updated.";
  }

  if (label === "getCampaignById") {
    const name = outputRecord?.name;
    return name ? `Loaded campaign ${String(name)}.` : "Campaign details loaded.";
  }

  if (label === "getTopCustomers" || label === "getChurnRiskCustomers" || label === "searchCustomers") {
    return Array.isArray(output) ? `${output.length} customer${output.length === 1 ? "" : "s"} returned.` : "Customer results ready.";
  }

  if (label === "getCustomerLTV") {
    const name = outputRecord?.name;
    return name ? `Loaded value profile for ${String(name)}.` : "Customer value details loaded.";
  }

  if (label === "getAnalyticsSummary") {
    const days = inputRecord?.days;
    return days ? `Performance summary for the last ${String(days)} days.` : "Performance summary ready.";
  }

  if (label === "retrieveKnowledgeContext") {
    return Array.isArray(output) ? `${output.length} knowledge match${output.length === 1 ? "" : "es"} found.` : "Knowledge lookup completed.";
  }

  if (label === "storeUserPreference") {
    const field = outputRecord?.field ?? inputRecord?.field;
    return field ? `Saved preference for ${String(field)}.` : "Preference saved.";
  }

  if (label === "recallUserContext") {
    return "User context loaded.";
  }

  if (label === "requestSuggestions") {
    return "Suggestions added to the current artifact.";
  }

  if (label === "createDocument" || label === "updateDocument") {
    return null;
  }

  return "Tool completed successfully.";
}

function getToolGlyph(label: string) {
  if (label === "retrieveKnowledgeContext" || label === "searchCustomers") {
    return <Search className="size-3.5 text-muted-foreground" />;
  }

  if (label === "createCampaign" || label === "createDocument" || label === "updateDocument") {
    return <WandSparkles className="size-3.5 text-muted-foreground" />;
  }

  return <Sparkles className="size-3.5 text-muted-foreground" />;
}

export function ToolCallNotification({
  displayName,
  errorText,
  input,
  label,
  output,
  state,
}: Readonly<{
  displayName?: string;
  errorText?: string;
  input?: unknown;
  label: string;
  output?: unknown;
  state: string;
}>) {
  const stateMeta = getStateMeta(state);
  const Icon = stateMeta.icon;
  const toolGlyph = getToolGlyph(label);
  const title = displayName ?? TOOL_DISPLAY_NAMES[label] ?? label;
  const summary = summarizeTool(label, input, output);

  return (
    <div className="my-2 w-full max-w-[420px] rounded-[18px] border border-border/40 bg-background/45 px-3.5 py-3 shadow-[0_1px_0_rgba(255,255,255,0.02)] backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-xl border border-border/30 bg-muted/35">
            {toolGlyph}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium tracking-tight text-foreground/92">{title}</div>
            {summary ? (
              <div className="mt-0.5 text-[12px] leading-5 text-muted-foreground/78">{summary}</div>
            ) : null}
          </div>
        </div>

        {stateMeta.showBadge ? (
          <div
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium",
              stateMeta.badgeClass,
            )}
          >
            <Icon className={cn("size-3.5", stateMeta.iconClass)} />
            <span>{stateMeta.label}</span>
          </div>
        ) : (
          <div className={cn("mt-0.5 inline-flex shrink-0 items-center gap-1.5 text-[11px] font-medium", stateMeta.inlineClass)}>
            <Icon className={cn("size-3.5", stateMeta.iconClass)} />
          </div>
        )}
      </div>

      {errorText ? (
        <div className="mt-3 rounded-2xl border border-rose-500/12 bg-rose-500/8 px-3 py-2 text-xs leading-5 text-rose-200">
            {errorText}
        </div>
      ) : null}
    </div>
  );
}
