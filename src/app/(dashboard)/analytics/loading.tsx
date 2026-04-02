import { Skeleton } from "@/components/feedback";

export default function Loading() {
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
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
