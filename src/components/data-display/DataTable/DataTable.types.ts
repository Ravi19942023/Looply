import type { ReactNode } from "react";

export interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

export interface DataTableColumn<T extends Record<string, unknown>> {
  key: keyof T | string;
  header: string;
  render?: (row: T, index: number) => ReactNode;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  width?: string;
  hideOnMobile?: boolean;
}

export interface DataTableProps<T extends Record<string, unknown>> {
  columns: Array<DataTableColumn<T>>;
  data: T[];
  getRowId: (row: T) => string;
  emptyState?: ReactNode;
  caption?: string;
  isLoading?: boolean;
  sortConfig?: SortConfig;
  onSort?: (config: SortConfig) => void;
  selectable?: boolean;
  selectedRows?: Set<string>;
  onSelectionChange?: (selected: Set<string>) => void;
  onRowClick?: (row: T) => void;
}
