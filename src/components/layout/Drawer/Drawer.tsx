"use client";

import { useEffect } from "react";
import type { MouseEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/utils";
import type { DrawerProps } from "./Drawer.types";

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  position = "right",
  size = "md",
}: DrawerProps) {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-end bg-background/80 backdrop-blur-sm animate-in fade-in duration-300"
      role="presentation" 
      onClick={handleBackdropClick}
    >
      <aside 
        className={cn(
          "relative flex h-full flex-col bg-background border-l border-border/40 shadow-2xl animate-in slide-in-from-right duration-500 ease-out",
          size === "sm" && "w-80",
          size === "md" && "w-[480px]",
          size === "lg" && "w-[640px]",
          size === "xl" && "w-[800px]",
          size === "full" && "w-full",
          position === "left" && "left-0 border-l-0 border-r slide-in-from-left"
        )}
        aria-modal="true" 
        role="dialog"
      >
        <header className="flex items-center justify-between border-b px-6 py-4 backdrop-blur-md bg-background/50 sticky top-0 z-10">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
          <Button 
            aria-label="Close drawer" 
            variant="ghost" 
            size="icon" 
            className="rounded-full size-8 hover:bg-muted"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6 scroll-smooth">
          {children}
        </div>
      </aside>
    </div>
  );
}

