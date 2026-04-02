import { TelemetryPage } from "@/features/telemetry";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Page({ searchParams }: PageProps) {
  return <TelemetryPage searchParams={searchParams} />;
}
