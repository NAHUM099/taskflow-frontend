import { ALLOWED_TRANSITIONS } from "@/lib/task-status";
import type { TaskResponse } from "@/lib/types";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { TaskStatusMenu } from "./TaskStatusMenu";

export function TaskCard({ task }: { task: TaskResponse }) {
  const hasTransitions = ALLOWED_TRANSITIONS[task.status].length > 0;

  return (
    <li className="grid grid-cols-1 gap-2 rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-3 transition-colors hover:bg-slate-800 sm:grid-cols-[minmax(0,1fr)_9rem_auto] sm:items-center sm:gap-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-100">
          {task.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {task.description}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-500 sm:hidden">
          {task.userName}
        </p>
      </div>

      <p className="hidden truncate text-sm text-slate-400 sm:block">
        {task.userName}
      </p>

      <div className="sm:justify-self-end">
        {hasTransitions ? (
          <TaskStatusMenu task={task} />
        ) : (
          <TaskStatusBadge status={task.status} />
        )}
      </div>
    </li>
  );
}
