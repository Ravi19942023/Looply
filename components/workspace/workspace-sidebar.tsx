"use client";

import {
  ActivityIcon,
  BarChart3Icon,
  BotIcon,
  FolderOpenIcon,
  LayoutDashboardIcon,
  MegaphoneIcon,
  MenuIcon,
  MessageSquarePlusIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import {
  getChatHistoryPaginationKey,
  SidebarHistory,
} from "@/components/chat/sidebar-history";
import { SidebarUserNav } from "@/components/chat/sidebar-user-nav";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useSidebar } from "@/components/ui/sidebar";
import type { AuthUser } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

type WorkspaceSection =
  | "assistant"
  | "campaigns"
  | "customers"
  | "dashboard"
  | "knowledge-base"
  | "system-logs"
  | "telemetry";

type Shortcut = {
  description: string;
  href: string;
  label: string;
};

const navigationItems: Array<{
  href: string;
  icon: typeof LayoutDashboardIcon;
  id: WorkspaceSection;
  label: string;
}> = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboardIcon,
  },
  {
    id: "assistant",
    label: "Assistant",
    href: "/assistant",
    icon: BotIcon,
  },
  {
    id: "telemetry",
    label: "Telemetry",
    href: "/telemetry",
    icon: ActivityIcon,
  },
  {
    id: "customers",
    label: "Customers",
    href: "/customers",
    icon: UsersIcon,
  },
  {
    id: "campaigns",
    label: "Campaigns",
    href: "/campaigns",
    icon: MegaphoneIcon,
  },
  {
    id: "knowledge-base",
    label: "Knowledge Base",
    href: "/knowledge-base",
    icon: FolderOpenIcon,
  },
  {
    id: "system-logs",
    label: "System Logs",
    href: "/system-logs",
    icon: BarChart3Icon,
  },
];

const sectionMeta: Record<
  WorkspaceSection,
  { description: string; shortcuts: Shortcut[]; title: string }
> = {
  dashboard: {
    title: "Dashboard",
    description: "Operational summary, revenue pulse, and quick entry points.",
    shortcuts: [
      {
        label: "Open Assistant",
        href: "/assistant",
        description: "Jump into the assistant workspace",
      },
      {
        label: "View Customers",
        href: "/customers?segment=enterprise",
        description: "Inspect enterprise accounts first",
      },
      {
        label: "Review Campaigns",
        href: "/campaigns?status=draft",
        description: "See campaigns waiting for action",
      },
    ],
  },
  assistant: {
    title: "Assistant",
    description: "Grouped conversation history and quick chat actions.",
    shortcuts: [],
  },
  customers: {
    title: "Customers",
    description: "Search accounts, segments, and churn signals.",
    shortcuts: [
      {
        label: "Enterprise",
        href: "/customers?segment=enterprise",
        description: "Filter to enterprise accounts",
      },
      {
        label: "Inactive",
        href: "/customers?segment=inactive",
        description: "Review win-back candidates",
      },
      {
        label: "High Churn",
        href: "/customers?sort=churn",
        description: "Focus on at-risk customers",
      },
    ],
  },
  campaigns: {
    title: "Campaigns",
    description: "Drafts, sends, and delivery progress in one place.",
    shortcuts: [
      {
        label: "Drafts",
        href: "/campaigns?status=draft",
        description: "Only show draft campaigns",
      },
      {
        label: "Sent",
        href: "/campaigns?status=sent",
        description: "Review sent campaigns",
      },
      {
        label: "Create In Chat",
        href: "/assistant?query=Create%20a%20campaign%20draft%20for%20premium%20customers",
        description: "Open the assistant with a campaign prompt",
      },
    ],
  },
  "knowledge-base": {
    title: "Knowledge Base",
    description: "Search seeded knowledge documents and playbooks.",
    shortcuts: [
      {
        label: "Retention",
        href: "/knowledge-base?q=retention",
        description: "Find retention docs",
      },
      {
        label: "Approvals",
        href: "/knowledge-base?q=approval",
        description: "Find approval policy docs",
      },
      {
        label: "Renewal",
        href: "/knowledge-base?q=renewal",
        description: "Find renewal guidance",
      },
    ],
  },
  telemetry: {
    title: "Telemetry",
    description: "Derived activity and output volume across the workspace.",
    shortcuts: [
      {
        label: "7 Days",
        href: "/telemetry?days=7",
        description: "Short-range activity view",
      },
      {
        label: "30 Days",
        href: "/telemetry?days=30",
        description: "Monthly activity view",
      },
      {
        label: "90 Days",
        href: "/telemetry?days=90",
        description: "Long-range trend view",
      },
    ],
  },
  "system-logs": {
    title: "System Logs",
    description: "Recent chat, campaign, document, and knowledge activity.",
    shortcuts: [
      {
        label: "All Activity",
        href: "/system-logs",
        description: "Show every recent event",
      },
      {
        label: "Campaign Activity",
        href: "/system-logs?type=campaign",
        description: "Filter to campaign events",
      },
      {
        label: "Knowledge Activity",
        href: "/system-logs?type=knowledge",
        description: "Filter to knowledge updates",
      },
    ],
  },
};

function getSectionFromPath(pathname: string | null): WorkspaceSection {
  if (!pathname) {
    return "dashboard";
  }
  if (pathname === "/" || pathname.startsWith("/dashboard")) {
    return "dashboard";
  }
  if (pathname.startsWith("/assistant") || pathname.startsWith("/chat")) {
    return "assistant";
  }
  if (pathname.startsWith("/customers")) {
    return "customers";
  }
  if (pathname.startsWith("/campaigns")) {
    return "campaigns";
  }
  if (pathname.startsWith("/knowledge-base")) {
    return "knowledge-base";
  }
  if (pathname.startsWith("/telemetry")) {
    return "telemetry";
  }
  return "system-logs";
}

function SectionShortcuts({ shortcuts }: { shortcuts: Shortcut[] }) {
  return (
    <div className="space-y-2">
      {shortcuts.map((shortcut) => (
        <Link
          className="block rounded-2xl border border-border/30 bg-background/60 px-4 py-3 transition hover:bg-muted/60"
          href={shortcut.href}
          key={shortcut.href}
        >
          <div className="font-medium text-sm">{shortcut.label}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {shortcut.description}
          </div>
        </Link>
      ))}
    </div>
  );
}

function SectionPane({
  section,
  user,
  onDeleteAll,
  onNavigate,
}: {
  onDeleteAll: () => void;
  onNavigate: () => void;
  section: WorkspaceSection;
  user: AuthUser;
}) {
  if (section === "assistant") {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border/10 px-4 py-4">
          <div className="mb-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
              Assistant
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Compact history and quick chat actions.
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              className="h-9 flex-1 rounded-xl"
              onClick={onNavigate}
              type="button"
            >
              <MessageSquarePlusIcon className="size-4" />
              New chat
            </Button>
            <Button
              className="h-9 rounded-xl"
              onClick={onDeleteAll}
              size="icon"
              type="button"
              variant="outline"
            >
              <Trash2Icon className="size-4" />
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <SidebarHistory user={user} />
        </div>
        <div className="border-t border-border/10 p-3">
          <SidebarUserNav user={user} />
        </div>
      </div>
    );
  }

  const meta = sectionMeta[section];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/10 px-4 py-5">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
          {meta.title}
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          {meta.description}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <SectionShortcuts shortcuts={meta.shortcuts} />
      </div>
      <div className="border-t border-border/10 p-3">
        <SidebarUserNav user={user} />
      </div>
    </div>
  );
}

export function WorkspaceSidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { open, openMobile, setOpenMobile, toggleSidebar } = useSidebar();
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);

  const section = getSectionFromPath(pathname);
  const activeHref = useMemo(() => {
    const activeItem = navigationItems.find((item) => item.id === section);
    return activeItem?.href ?? "/dashboard";
  }, [section]);

  const handleNavigate = (href: string) => {
    router.push(href);
    setOpenMobile(false);
  };

  const handleDeleteAll = () => {
    setShowDeleteAllDialog(false);
    router.replace("/assistant");
    mutate(unstable_serialize(getChatHistoryPaginationKey), [], {
      revalidate: false,
    });
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history`, {
      method: "DELETE",
    });
    toast.success("All chats deleted");
  };

  const rail = (
    <div className="flex h-full w-[72px] shrink-0 flex-col border-r border-border/10 bg-sidebar px-3 py-4">
      <div className="flex flex-col items-center gap-3">
        <button
          aria-label={open ? "Collapse navigation" : "Expand navigation"}
          className="inline-flex size-10 items-center justify-center rounded-2xl border border-border/50 bg-background/70 text-foreground transition hover:bg-muted"
          onClick={() => toggleSidebar()}
          type="button"
        >
          <MenuIcon className="size-4" />
        </button>
      </div>

      <nav aria-label="Workspace navigation" className="mt-6 flex-1 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeHref === item.href;

          return (
            <button
              aria-label={item.label}
              className={cn(
                "inline-flex size-10 w-full items-center justify-center rounded-2xl border transition",
                isActive
                  ? "border-foreground/10 bg-foreground/5 text-foreground"
                  : "border-transparent bg-transparent text-muted-foreground hover:border-border/40 hover:bg-muted/50 hover:text-foreground"
              )}
              key={item.href}
              onClick={() => handleNavigate(item.href)}
              type="button"
            >
              <Icon className="size-4" />
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      <div className="hidden h-dvh shrink-0 lg:flex">
        {rail}
        <div
          className={cn(
            "overflow-hidden border-r border-border/10 bg-sidebar/40 backdrop-blur-sm transition-[width,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "w-[280px] opacity-100" : "w-0 opacity-0"
          )}
        >
          {open ? (
            <SectionPane
              onDeleteAll={() => setShowDeleteAllDialog(true)}
              onNavigate={() => handleNavigate("/assistant")}
              section={section}
              user={user}
            />
          ) : null}
        </div>
      </div>

      <Sheet onOpenChange={setOpenMobile} open={openMobile}>
        <SheetContent
          className="w-[360px] max-w-[92vw] border-r border-border/20 bg-sidebar p-0"
          side="left"
        >
          <SheetTitle className="sr-only">Workspace navigation</SheetTitle>
          <div className="flex h-full min-h-0">
            {rail}
            <div className="min-h-0 flex-1 border-l border-border/10 bg-sidebar/40 backdrop-blur-sm">
              <SectionPane
                onDeleteAll={() => setShowDeleteAllDialog(true)}
                onNavigate={() => handleNavigate("/assistant")}
                section={section}
                user={user}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        onOpenChange={setShowDeleteAllDialog}
        open={showDeleteAllDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all chats?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove all
              saved assistant conversations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll}>
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
