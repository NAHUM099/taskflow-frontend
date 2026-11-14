import { Inbox } from "lucide-react";
import type { TaskResponse } from "@/lib/types";
import { TaskCard } from "./TaskCard";

interface TaskListProps {
  tasks: TaskResponse[];
  filtered: boolean;
  canCreate: boolean;
  onCreate: () => void;
}

export function TaskList({
  tasks,
  filtered,
  canCreate,
  onCreate,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-700/60 bg-slate-800 px-6 py-12 text-center">
        <Inbox className="size-8 text-slate-600" aria-hidden="true" />
        <p className="text-sm text-slate-400">
          {filtered
            ? "No hay tareas que coincidan con los filtros."
            : "No hay tareas todavía."}
        </p>
        {!filtered && canCreate && (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            Crear primera tarea
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="hidden px-4 text-xs font-medium text-slate-500 sm:grid sm:grid-cols-[minmax(0,1fr)_9rem_auto] sm:gap-4">
        <span>Tarea</span>
        <span>Usuario</span>
        <span className="justify-self-end">Estado</span>
      </div>

      <ul className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard key={task.id ?? task.title} task={task} />
        ))}
      </ul>
    </div>
  );
}
