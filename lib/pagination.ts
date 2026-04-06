export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type SearchParamValue = string | string[] | undefined;

export type SearchParams = Record<string, SearchParamValue>;

export function getSearchParamValue(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

export function createUrlSearchParams(searchParams: SearchParams) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value == null) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item);
      }
      continue;
    }

    params.set(key, value);
  }

  return params;
}

function parsePositiveInteger(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0 ? value : null;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function normalizePaginationInput(input: {
  page?: string | number | null;
  pageSize?: string | number | null;
  defaultPageSize?: number;
  maxPageSize?: number;
}) {
  const defaultPageSize = input.defaultPageSize ?? DEFAULT_PAGE_SIZE;
  const maxPageSize = input.maxPageSize ?? MAX_PAGE_SIZE;

  const parsedPage = parsePositiveInteger(input.page);
  const parsedPageSize = parsePositiveInteger(input.pageSize);

  const page = parsedPage ?? DEFAULT_PAGE;
  const pageSize = Math.min(parsedPageSize ?? defaultPageSize, maxPageSize);

  const didNormalizeInput =
    (input.page != null && parsedPage == null) ||
    (input.pageSize != null && parsedPageSize == null) ||
    (parsedPageSize != null && parsedPageSize > maxPageSize);

  return {
    didNormalizeInput,
    offset: (page - 1) * pageSize,
    page,
    pageSize,
  };
}

export function buildPaginationMeta(input: {
  page: number;
  pageSize: number;
  total: number;
}): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(input.total / input.pageSize));
  const page = Math.min(Math.max(input.page, DEFAULT_PAGE), totalPages);

  return {
    page,
    pageSize: input.pageSize,
    total: input.total,
    totalPages,
  };
}
