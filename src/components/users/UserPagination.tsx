import { ChevronLeft, ChevronRight } from "lucide-react";

interface UserPaginationProps {
  page: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  isFetching: boolean;
  onPageChange: (page: number) => void;
}

export function UserPagination({
  page,
  totalPages,
  first,
  last,
  isFetching,
  onPageChange,
}: UserPaginationProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={first || isFetching}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-700 px-3 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Anterior
      </button>

      <span className="text-sm text-slate-400">
        Página {page + 1} de {totalPages}
      </span>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={last || isFetching}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-700 px-3 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Siguiente
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
