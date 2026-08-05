import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  startItem: number;
  endItem: number;
  totalItems: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onGoToPage: (page: number) => void;
  className?: string;
  itemLabel?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  startItem,
  endItem,
  totalItems,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onGoToPage,
  className,
  itemLabel = "registros",
}: PaginationProps) {
  if (totalItems === 0) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <p className="text-xs text-slate-500">
        Mostrando <span className="font-medium text-slate-700">{startItem}–{endItem}</span> de{" "}
        <span className="font-medium text-slate-700">{totalItems}</span> {itemLabel}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          disabled={!hasPrev}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600",
            "transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          )}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onGoToPage(page)}
            className={cn(
              "inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-medium transition-colors",
              page === currentPage
                ? "bg-cyan-600 text-white"
                : "border border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
            aria-label={`Página ${page}`}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600",
            "transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          )}
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
