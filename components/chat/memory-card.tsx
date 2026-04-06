"use client";

export function MemoryCard({
  title,
  values,
}: Readonly<{
  title: string;
  values: Array<{ label: string; value: string | null | undefined }>;
}>) {
  return (
    <div className="w-[min(100%,520px)] rounded-2xl border border-border/50 bg-card/60 p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 font-medium text-sm">{title}</div>
      <div className="space-y-2">
        {values.map((item) => (
          <div
            className="flex items-start justify-between gap-4 rounded-xl border border-border/40 bg-background/70 px-3 py-2"
            key={item.label}
          >
            <div className="text-muted-foreground text-[12px] uppercase tracking-wide">
              {item.label}
            </div>
            <div className="max-w-[70%] text-right text-sm">
              {item.value && item.value.length > 0 ? item.value : "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
