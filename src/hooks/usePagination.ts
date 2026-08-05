"use client";

import { useCallback, useMemo, useState } from "react";

interface UsePaginationOptions {
  totalItems: number;
  pageSize?: number;
  initialPage?: number;
}

export function usePagination({
  totalItems,
  pageSize = 5,
  initialPage = 1,
}: UsePaginationOptions) {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const safePage = Math.min(currentPage, totalPages);

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages]
  );

  const nextPage = useCallback(() => goToPage(safePage + 1), [goToPage, safePage]);
  const prevPage = useCallback(() => goToPage(safePage - 1), [goToPage, safePage]);

  const paginate = useCallback(
    <T,>(items: T[]): T[] => {
      const start = (safePage - 1) * pageSize;
      return items.slice(start, start + pageSize);
    },
    [safePage, pageSize]
  );

  const resetPage = useCallback(() => setCurrentPage(1), []);

  const paginationInfo = useMemo(
    () => ({
      currentPage: safePage,
      totalPages,
      pageSize,
      totalItems,
      startItem: totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1,
      endItem: Math.min(safePage * pageSize, totalItems),
      hasPrev: safePage > 1,
      hasNext: safePage < totalPages,
    }),
    [safePage, totalPages, pageSize, totalItems]
  );

  return {
    ...paginationInfo,
    goToPage,
    nextPage,
    prevPage,
    paginate,
    resetPage,
  };
}
