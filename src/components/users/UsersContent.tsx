"use client";

import { useEffect, useState } from "react";
import { CircleAlert, RotateCw, Search } from "lucide-react";
import { useUsers } from "@/hooks/queries/useUsers";
import type { UserResponse } from "@/lib/types";
import { UsersHeader } from "./UsersHeader";
import { UserList } from "./UserList";
import { UserPagination } from "./UserPagination";
import { EditUserModal } from "./EditUserModal";

const PAGE_SIZE = 10;
const DEBOUNCE_MS = 350;

export function UsersContent() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);

  useEffect(() => {
    const trimmedSearch = search.trim();
    // Sin cambio real no hay nada que debouncear: así el timer de montaje no
    // devuelve la paginación a 0 después de la primera carga.
    if (trimmedSearch === debouncedSearch) {
      return;
    }

    const timeout = setTimeout(() => {
      setDebouncedSearch(trimmedSearch);
      setPage(0);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [search, debouncedSearch]);

  const { data, isLoading, isError, isFetching, refetch } = useUsers({
    page,
    size: PAGE_SIZE,
    search: debouncedSearch || undefined,
  });
  const pageData = data ?? null;
  const users = pageData?.content ?? [];

  return (
    <div className="flex flex-col gap-6">
      <UsersHeader />

      <div className="relative sm:max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre o email..."
          aria-label="Buscar usuarios"
          className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        />
      </div>

      {isLoading ? (
        <UsersSkeleton />
      ) : isError ? (
        <UsersError onRetry={() => refetch()} />
      ) : (
        <>
          <UserList
            users={users}
            searching={debouncedSearch.length > 0}
            onEdit={setEditingUser}
          />
          {pageData && pageData.totalPages > 1 && (
            <UserPagination
              page={pageData.number}
              totalPages={pageData.totalPages}
              first={pageData.first}
              last={pageData.last}
              isFetching={isFetching}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  );
}

function UsersSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-xl border border-slate-700/60 bg-slate-800/60"
        />
      ))}
    </div>
  );
}

function UsersError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-slate-700/60 bg-slate-800 px-6 py-12 text-center">
      <CircleAlert className="size-8 text-slate-500" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-slate-100">
          No pudimos cargar los usuarios.
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
