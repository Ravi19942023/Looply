import { Skeleton } from "@/components/feedback";

export default function Loading() {
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <Skeleton height={180} />
      <Skeleton height={72} />
      <Skeleton height={72} />
      <Skeleton height={72} />
    </div>
  );
}
