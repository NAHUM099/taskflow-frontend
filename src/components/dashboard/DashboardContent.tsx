"use client";

import { CircleAlert, RotateCw } from "lucide-react";
import { useTasks } from "@/hooks/queries/useTasks";
import { DashboardStats } from "./DashboardStats";
import { RecentTasks } from "./RecentTasks";

export function DashboardContent() {
  const { data, isLoading, isError, refetch } = useTasks();
  const tasks = data ?? [];

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return <DashboardError onRetry={() => refetch()} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <DashboardStats tasks={tasks} />
      <RecentTasks tasks={tasks} />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-2xl border border-slate-700/60 bg-slate-800/60"
          />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-14 animate-pulse rounded-xl border border-slate-700/60 bg-slate-800/60"
          />
        ))}
      </div>
    </div>
  );
}

function DashboardError({ onRetry }: { onRetry: () => void }) {
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
