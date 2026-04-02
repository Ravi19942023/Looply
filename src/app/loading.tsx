import { Skeleton } from "@/components/feedback";

export default function Loading() {
  return (
    <main style={{ display: "grid", gap: "1rem", padding: "2rem" }}>
      <Skeleton height={48} width="40%" />
      <Skeleton height={220} />
      <Skeleton height={220} />
    </main>
  );
}
