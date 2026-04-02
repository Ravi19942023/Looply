import { Skeleton } from "@/components/feedback";

export default function Loading() {
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <Skeleton height={40} width={240} />
        <Skeleton height={40} width={140} />
      </div>
      <Skeleton height={48} />
      <Skeleton height={48} />
      <Skeleton height={48} />
      <Skeleton height={48} />
      <Skeleton height={48} />
      <Skeleton height={48} />
    </div>
  );
}
