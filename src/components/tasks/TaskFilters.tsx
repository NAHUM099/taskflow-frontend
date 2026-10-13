import { TASK_STATUS_META, type StatusFilter } from "@/lib/task-status";

interface TaskFiltersProps {
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
}

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "ALL", label: "Todos" },
  { value: "PENDING", label: TASK_STATUS_META.PENDING.label },
  { value: "IN_PROGRESS", label: TASK_STATUS_META.IN_PROGRESS.label },
  { value: "DONE", label: TASK_STATUS_META.DONE.label },
  { value: "CANCELLED", label: TASK_STATUS_META.CANCELLED.label },
];

export function TaskFilters({ value, onChange }: TaskFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="task-status-filter" className="text-sm text-slate-400">
        Estado
      </label>
      <select
        id="task-status-filter"
        value={value}
        onChange={(event) => onChange(event.target.value as StatusFilter)}
        className="h-10 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
