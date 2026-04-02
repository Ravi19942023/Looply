import { Skeleton } from "@/components/feedback";

export default function Loading() {
  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <Skeleton height={28} width="35%" />
      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))" }}>
        <Skeleton height={144} />
        <Skeleton height={144} />
        <Skeleton height={144} />
        <Skeleton height={144} />
      </div>
      <Skeleton height={260} />
      <Skeleton height={320} />
    </div>
  );
}
