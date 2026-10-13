import type { TaskStatus } from "@/lib/types";

export type StatusFilter = "ALL" | TaskStatus;

export interface TaskStatusMeta {
  label: string;
  badgeClass: string;
}

export const TASK_STATUS_META: Record<TaskStatus, TaskStatusMeta> = {
  PENDING: {
    label: "Pendiente",
    badgeClass: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
  },
  IN_PROGRESS: {
    label: "En progreso",
    badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  },
  DONE: {
    label: "Completada",
    badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  },
  CANCELLED: {
    label: "Cancelada",
    badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/30",
  },
};

// Espejo de TaskStatus.allowedTransitions del backend.
export const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  PENDING: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["DONE", "CANCELLED"],
  DONE: [],
  CANCELLED: [],
};
