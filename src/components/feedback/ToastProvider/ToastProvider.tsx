"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/utils";
import type { ToastContextValue, ToastInput, ToastProviderProps, ToastRecord } from "./ToastProvider.types";

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  useEffect(() => {
    const timers = new Map<string, number>();

    for (const toast of toasts) {
      if (toast.duration > 0 && !timers.has(toast.id)) {
        timers.set(
          toast.id,
          window.setTimeout(() => {
            setToasts((current) => current.filter((item) => item.id !== toast.id));
          }, toast.duration),
        );
      }
    }

    return () => {
      for (const timer of timers.values()) {
        window.clearTimeout(timer);
      }
    };
  }, [toasts]);

  const value = useMemo<ToastContextValue>(
    () => ({
      toast: (input: ToastInput) => {
        const id = crypto.randomUUID();
        const duration = input.duration ?? (input.variant === "error" ? 8000 : 4000);
        setToasts((current) => [
          ...current,
          {
            id,
            title: input.title,
            description: input.description,
            variant: input.variant ?? "info",
            duration,
          },
        ]);
      },
    }),
    [],
  );

  function dismissToast(id: string) {
    setToasts((current) => current.filter((item) => item.id !== id));
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div 
        aria-live="polite" 
        className="fixed bottom-0 right-0 z-[200] flex flex-col gap-3 p-6 w-full max-w-sm pointer-events-none" 
        role="status"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: Readonly<{
  toast: ToastRecord;
  onDismiss: (id: string) => void;
}>) {
  const variantStyles = {
    info: "border-border/40 bg-background/95 text-foreground",
    success: "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
    warning: "border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400",
    error: "border-destructive/20 bg-destructive/5 text-destructive",
  };

  const icons = {
    info: <Info className="size-4" />,
    success: <CheckCircle2 className="size-4" />,
    warning: <AlertTriangle className="size-4" />,
    error: <AlertCircle className="size-4" />,
  };

  return (
    <div 
      className={cn(
        "pointer-events-auto flex items-start gap-4 p-4 rounded-xl border border-border/40 bg-background/90 backdrop-blur-md shadow-lg transition-all animate-in slide-in-from-right-full duration-300",
        variantStyles[toast.variant as keyof typeof variantStyles] || variantStyles.info
      )}
    >
      <div className="mt-0.5 shrink-0">
        {icons[toast.variant as keyof typeof icons] || icons.info}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={"text-sm font-semibold leading-tight mb-1"}>{toast.title}</h4>
        {toast.description && (
          <p className="text-xs text-muted-foreground/80 leading-relaxed font-medium">
            {toast.description}
          </p>
        )}
      </div>
      <Button 
        aria-label="Dismiss toast" 
        variant="ghost" 
        size="icon" 
        className="size-6 rounded-lg -mr-1 hover:bg-muted" 
        onClick={() => onDismiss(toast.id)}
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
}

