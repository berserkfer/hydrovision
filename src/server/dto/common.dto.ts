/**
 * DTOs compartidos — paginación, búsqueda y ordenamiento (Sprint 3E)
 */

export interface ListQueryDto {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResultDto<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function parseListQuery(searchParams: URLSearchParams): ListQueryDto {
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "10");
  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: Number.isFinite(pageSize) && pageSize > 0 ? Math.min(pageSize, 100) : 10,
    search: searchParams.get("search")?.trim() || undefined,
    sortBy: searchParams.get("sortBy")?.trim() || undefined,
    sortOrder: searchParams.get("sortOrder") === "desc" ? "desc" : "asc",
  };
}

export function paginateArray<T>(
  items: T[],
  query: ListQueryDto
): PaginatedResultDto<T> {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 10;
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export function sortArray<T>(
  items: T[],
  sortBy: string | undefined,
  sortOrder: "asc" | "desc" = "asc"
): T[] {
  if (!sortBy) return items;
  return [...items].sort((a, b) => {
    const av = (a as Record<string, unknown>)[sortBy];
    const bv = (b as Record<string, unknown>)[sortBy];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = String(av).localeCompare(String(bv), "es", { numeric: true });
    return sortOrder === "desc" ? -cmp : cmp;
  });
}

export function filterBySearch<T>(
  items: T[],
  search: string | undefined,
  fields: (keyof T)[]
): T[] {
  if (!search) return items;
  const q = search.toLowerCase();
  return items.filter((item) =>
    fields.some((field) => String(item[field] ?? "").toLowerCase().includes(q))
  );
}
