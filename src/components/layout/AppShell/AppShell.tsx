import { cn } from "@/lib/utils";
import type { AppShellProps } from "./AppShell.types";

export function AppShell({
  sidebar,
  topbar,
  children,
  chatSlot,
  customSidebar,
  isFullBleed,
  hideHeader,
}: AppShellProps) {
  const sidebarContent = customSidebar ?? sidebar;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background font-sans text-foreground selection:bg-primary/10">
      <div
        className={cn(
          "grid h-full flex-1 overflow-hidden transition-all duration-300",
          chatSlot
            ? "xl:grid-cols-[var(--sidebar-width)_minmax(0,1fr)_var(--chat-width)]"
            : "xl:grid-cols-[var(--sidebar-width)_minmax(0,1fr)]",
          "[--sidebar-width:17.5rem] [--chat-width:24rem]"
        )}
      >
        {/* Sidebar */}
        <aside className="z-20 hidden border-r border-border/10 bg-sidebar/50 backdrop-blur-sm transition-transform duration-300 xl:block">
          {sidebarContent}
        </aside>

        {/* Main Content Area */}
        <div className="relative flex min-w-0 flex-col overflow-hidden bg-background/5">
          {/* TopBar with Glassmorphism */}
          {!hideHeader && (
            <header className="sticky top-0 z-10 shrink-0 border-b border-border/10 bg-background/40 px-6 py-4 backdrop-blur-xl transition-all duration-300">
              {topbar}
            </header>
          )}

          <main className={cn(
            "relative flex-1 flex flex-col min-h-0",
            !isFullBleed && "p-8 pb-20 lg:p-12 overflow-y-auto scroll-smooth"
          )}>
            <div className={cn(
              "animate-fade-in transition-all flex flex-col flex-1 min-h-0",
              !isFullBleed && "mx-auto w-full max-w-7xl"
            )}>
              {children}
            </div>
          </main>
        </div>

        {/* Optional Chat Slot */}
        {chatSlot ? (
          <aside className="z-10 hidden border-l border-border/10 bg-card/5 backdrop-blur-md xl:block">
            {chatSlot}
          </aside>
        ) : null}
      </div>
    </div>
  );
}



