import { Skeleton } from "@/components/feedback";

export default function Loading() {
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <Skeleton height={40} width={320} />
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <Skeleton height={36} width={120} />
        <Skeleton height={36} width={120} />
        <Skeleton height={36} width={120} />
      </div>
      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        <Skeleton height={220} />
        <Skeleton height={220} />
        <Skeleton height={220} />
        <Skeleton height={220} />
      </div>
    </div>
  );
}
