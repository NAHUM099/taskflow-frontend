import { Plus } from "lucide-react";

interface TasksHeaderProps {
  canCreate: boolean;
  onNewTask: () => void;
}

export function TasksHeader({ canCreate, onNewTask }: TasksHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-400">
        Gestiona y controla las tareas del sistema.
      </p>
      {canCreate && (
        <button
          type="button"
          onClick={onNewTask}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <Plus className="size-4" aria-hidden="true" />
          Nueva tarea
        </button>
      )}
    </div>
  );
}
