import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { InlineAlertProps } from "./InlineAlert.types";

const alertVariants = cva(
  "relative w-full rounded-xl border p-4 transition-all",
  {
    variants: {
      variant: {
        info: "bg-blue-500/5 border-blue-500/20 text-blue-700",
        success: "bg-emerald-500/5 border-emerald-500/20 text-emerald-700",
        warning: "bg-amber-500/5 border-amber-500/20 text-amber-700",
        error: "bg-destructive/5 border-destructive/20 text-destructive",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

export function InlineAlert({ title, description, variant = "info", className }: InlineAlertProps & VariantProps<typeof alertVariants> & { className?: string }) {
  return (
    <div className={cn(alertVariants({ variant }), className)} role="alert">
      <h4 className="font-semibold text-sm tracking-tight mb-1">{title}</h4>
      {description ? <p className="text-sm opacity-90 leading-snug">{description}</p> : null}
    </div>
  );
}

