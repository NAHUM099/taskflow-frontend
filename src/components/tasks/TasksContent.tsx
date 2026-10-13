"use client";

import { useState } from "react";
import { CircleAlert, RotateCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTasks } from "@/hooks/queries/useTasks";
import type { StatusFilter } from "@/lib/task-status";
import type { TaskFilters as TaskQueryFilters } from "@/lib/types";
import { TasksHeader } from "./TasksHeader";
import { TaskFilters } from "./TaskFilters";
import { TaskList } from "./TaskList";
import { CreateTaskModal } from "./CreateTaskModal";

export function TasksContent() {
  const { user } = useAuth();
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const canCreate = user?.role === "ROLE_ADMIN";

  const filters: TaskQueryFilters = status === "ALL" ? {} : { status };
  const { data, isLoading, isError, refetch } = useTasks(filters);
  const tasks = data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <TasksHeader canCreate={canCreate} onNewTask={() => setModalOpen(true)} />
      <TaskFilters value={status} onChange={setStatus} />

      {isLoading ? (
        <TasksSkeleton />
      ) : isError ? (
        <TasksError onRetry={() => refetch()} />
      ) : (
        <TaskList
          tasks={tasks}
          filtered={status !== "ALL"}
          canCreate={canCreate}
          onCreate={() => setModalOpen(true)}
        />
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
