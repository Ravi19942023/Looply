export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-3xl border border-border/40 bg-card/60 p-5 shadow-[var(--shadow-card)]">
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">
        {label}
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight">{value}</div>
      {hint ? (
        <div className="mt-2 text-sm text-muted-foreground">{hint}</div>
      ) : null}
    </div>
  );
}
