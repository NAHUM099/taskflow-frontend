"use client";

import { useEffect, useState } from "react";
import { CircleAlert, RotateCw, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTasks } from "@/hooks/queries/useTasks";
import type { StatusFilter } from "@/lib/task-status";
import type { TaskListParams } from "@/lib/types";
import { TasksHeader } from "./TasksHeader";
import { TaskFilters } from "./TaskFilters";
import { TaskList } from "./TaskList";
import { TaskPagination } from "./TaskPagination";
import { CreateTaskModal } from "./CreateTaskModal";

const DEBOUNCE_MS = 350;
const PAGE_SIZE = 10;

export function TasksContent() {
  const { user } = useAuth();
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const canCreate = user?.role === "ROLE_ADMIN";

  useEffect(() => {
    const trimmedSearch = search.trim();
    // Sin cambio real no hay nada que debouncear: así el timer de montaje no
    // dispara una consulta extra al cargar la página.
    if (trimmedSearch === debouncedSearch) {
      return;
    }

    const timeout = setTimeout(() => {
      setDebouncedSearch(trimmedSearch);
      // Una búsqueda nueva siempre empieza en la primera página.
      setPage(0);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [search, debouncedSearch]);

  function handleStatusChange(value: StatusFilter) {
    setStatus(value);
    setPage(0);
  }

  const params: TaskListParams = { page, size: PAGE_SIZE };
  if (status !== "ALL") {
    params.status = status;
  }
  if (debouncedSearch) {
    params.search = debouncedSearch;
  }

  const { data, isLoading, isError, isFetching, refetch } = useTasks(params);
  const tasks = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const filtered = status !== "ALL" || debouncedSearch.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <TasksHeader canCreate={canCreate} onNewTask={() => setModalOpen(true)} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre de tarea..."
            aria-label="Buscar tareas"
            className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>

        <TaskFilters value={status} onChange={handleStatusChange} />
      </div>

      {isLoading ? (
        <TasksSkeleton />
      ) : isError ? (
        <TasksError onRetry={() => refetch()} />
      ) : (
        <div className="flex flex-col gap-4">
          <TaskList
            tasks={tasks}
            filtered={filtered}
            canCreate={canCreate}
            onCreate={() => setModalOpen(true)}
          />

          {totalPages > 1 && (
            <TaskPagination
              page={page}
              totalPages={totalPages}
              first={data?.first ?? true}
              last={data?.last ?? true}
              isFetching={isFetching}
              onPageChange={setPage}
            />
          )}
        </div>
      )}

      {modalOpen && <CreateTaskModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}

function TasksSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-xl border border-slate-700/60 bg-slate-800/60"
        />
      ))}
    </div>
  );
}

function TasksError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-slate-700/60 bg-slate-800 px-6 py-12 text-center">
      <CircleAlert className="size-8 text-slate-500" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-slate-100">
          No pudimos cargar las tareas.
        </h2>
        <p className="text-sm text-slate-400">
          Revisa tu conexión e inténtalo nuevamente.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <RotateCw className="size-4" aria-hidden="true" />
        Reintentar
      </button>
    </div>
  );
}
