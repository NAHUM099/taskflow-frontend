import { CircleCheck, Clock, LayoutList, Loader } from "lucide-react";
import type { TaskResponse, TaskStatus } from "@/lib/types";

interface DashboardStatsProps {
  tasks: TaskResponse[];
}

function countByStatus(tasks: TaskResponse[], status: TaskStatus): number {
  return tasks.filter((task) => task.status === status).length;
}

export function DashboardStats({ tasks }: DashboardStatsProps) {
  const cards = [
    {
      label: "Total",
      value: tasks.length,
      icon: LayoutList,
      iconClass: "text-slate-300",
    },
    {
      label: "Pendientes",
      value: countByStatus(tasks, "PENDING"),
      icon: Clock,
      iconClass: "text-cyan-300",
    },
    {
      label: "En progreso",
      value: countByStatus(tasks, "IN_PROGRESS"),
      icon: Loader,
      iconClass: "text-amber-300",
    },
    {
      label: "Completadas",
      value: countByStatus(tasks, "DONE"),
      icon: CircleCheck,
      iconClass: "text-emerald-300",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-slate-700/60 bg-slate-800 p-5"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-slate-400">{card.label}</span>
            <card.icon
              className={`size-5 shrink-0 ${card.iconClass}`}
              aria-hidden="true"
            />
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-100">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
