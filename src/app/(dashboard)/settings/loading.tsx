import { Skeleton } from "@/components/feedback";

export default function Loading() {
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <Skeleton height={44} width="45%" />
      <Skeleton height={44} />
      <Skeleton height={44} />
      <Skeleton height={44} />
      <Skeleton height={44} width="30%" />
    </div>
  );
}
