"use client";

import { useEffect } from "react";
import type { MouseEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/utils";
import type { ModalProps } from "./Modal.types";

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-300"
      role="presentation" 
      onClick={handleBackdropClick}
    >
      <div 
        aria-modal="true" 
        className="relative w-full max-w-lg rounded-2xl border border-border/40 bg-background shadow-2xl animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        <header className="flex items-center justify-between border-b px-6 py-4 backdrop-blur-md bg-background/50 rounded-t-2xl">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
          <Button 
            aria-label="Close modal" 
            variant="ghost" 
            size="icon" 
            className="rounded-full size-8 hover:bg-muted"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </header>
        <div className="px-6 py-6 overflow-y-auto max-h-[80vh] scroll-smooth">
          {children}
        </div>
      </div>
    </div>
  );
}

