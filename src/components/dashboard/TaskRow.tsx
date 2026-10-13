import type { TaskResponse } from "@/lib/types";
import { TASK_STATUS_META } from "@/lib/task-status";

interface TaskRowProps {
  task: TaskResponse;
}

export function TaskRow({ task }: TaskRowProps) {
  const status = TASK_STATUS_META[task.status];

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-3 transition-colors hover:border-slate-600/80 hover:bg-slate-800">
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-sm font-medium text-slate-100">
          {task.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-500 sm:hidden">
          {task.userName}
        </p>
      </div>
      <p className="hidden w-36 shrink-0 truncate text-sm text-slate-400 sm:block">
        {task.userName}
      </p>
      <span
        className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.badgeClass}`}
      >
        {status.label}
      </span>
    </li>
  );
}
