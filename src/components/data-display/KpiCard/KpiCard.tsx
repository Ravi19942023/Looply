import { Card } from "@/components/atoms/Card/Card";
import { Skeleton } from "@/components/feedback/Skeleton";
import { cn } from "@/lib/utils";
import type { KpiCardProps } from "./KpiCard.types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatValue } from "@/shared/formatters/number";

export function KpiCard({
  label,
  value,
  previousValue,
  trend,
  trendPercentage,
  formatType = "number",
  tone = "default",
  icon,
  loading,
  error,
  onClick,
}: KpiCardProps) {
  const isPositive = trend === "up";
  const isNegative = trend === "down";

  return (
    <Card
      className={cn(
        "group relative flex flex-col gap-4 overflow-hidden p-6 transition-all duration-300",
        onClick && "cursor-pointer hover:shadow-float active:scale-[0.98]"
      )}
      onClick={onClick}
    >
      {/* Decorative Glow depending on Tone */}
      <div className={cn(
        "absolute -right-4 -top-4 size-24 blur-3xl opacity-10 transition-opacity group-hover:opacity-20",
        tone === "positive" ? "bg-emerald-500" : tone === "warning" ? "bg-amber-500" : "bg-primary"
      )} />

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 transition-colors group-hover:text-muted-foreground">
          {label}
        </span>
        {icon && (
          <div className={cn(
            "flex size-9 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-all group-hover:scale-110 group-hover:bg-muted group-hover:text-foreground",
            tone === "positive" && "text-emerald-500 group-hover:text-emerald-600",
            tone === "warning" && "text-amber-500 group-hover:text-amber-600"
          )}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {loading ? (
          <Skeleton className="h-9 w-32 rounded-lg" />
        ) : error ? (
          <span className="text-xl font-bold text-destructive">Error</span>
        ) : (
          <span className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
            {formatValue(value, formatType)}
          </span>
        )}

        <div className="flex items-center gap-2">
          {trend && (
            <div className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              isPositive ? "bg-emerald-500/10 text-emerald-600" : isNegative ? "bg-amber-500/10 text-amber-600" : "bg-muted text-muted-foreground"
            )}>
              {isPositive ? <TrendingUp size={10} /> : isNegative ? <TrendingDown size={10} /> : <Minus size={10} />}
              {trendPercentage ? `${trendPercentage.toFixed(1)}%` : ""}
            </div>
          )}
          {previousValue !== undefined && !loading && (
            <span className="text-[10px] font-medium text-muted-foreground/50">
              vs {formatValue(previousValue, formatType)} last period
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

