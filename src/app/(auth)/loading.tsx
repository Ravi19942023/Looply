import { Skeleton } from "@/components/feedback";

export default function Loading() {
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <Skeleton height={44} width="55%" />
      <Skeleton height={44} />
      <Skeleton height={44} />
      <Skeleton height={44} />
      <Skeleton height={48} width="40%" />
    </div>
  );
}
