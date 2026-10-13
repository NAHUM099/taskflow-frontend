import { Inbox } from "lucide-react";
import type { TaskResponse } from "@/lib/types";
import { TaskRow } from "./TaskRow";

interface RecentTasksProps {
  tasks: TaskResponse[];
}

export function RecentTasks({ tasks }: RecentTasksProps) {
  const recent = tasks.slice(0, 5);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-slate-300">Tareas recientes</h2>

      {recent.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-700/60 bg-slate-800 px-6 py-10 text-center">
          <Inbox className="size-8 text-slate-600" aria-hidden="true" />
          <p className="text-sm text-slate-400">No hay tareas todavía.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {recent.map((task) => (
            <TaskRow key={task.id ?? task.title} task={task} />
          ))}
        </ul>
      )}
    </section>
  );
}
