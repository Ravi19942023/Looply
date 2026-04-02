"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@/components/data-display/Pagination";

interface PaginationWrapperProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function PaginationWrapper({ page, pageSize, total, totalPages }: PaginationWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", p.toString());
    router.push(`${pathname}?${params.toString()}` as any);
  };

  return (
    <Pagination
      pagination={{
        page,
        pageSize,
        total,
        totalPages,
      }}
      onPageChange={handlePageChange}
    />
  );
}
