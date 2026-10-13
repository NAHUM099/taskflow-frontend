import { TASK_STATUS_META } from "@/lib/task-status";
import type { TaskStatus } from "@/lib/types";

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const meta = TASK_STATUS_META[status];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.badgeClass}`}
    >
      {meta.label}
    </span>
  );
}
