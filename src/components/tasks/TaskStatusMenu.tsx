"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Loader } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/errors";
import { useUpdateTaskStatus } from "@/hooks/mutations/useUpdateTaskStatus";
import { ALLOWED_TRANSITIONS, TASK_STATUS_META } from "@/lib/task-status";
import type { TaskResponse, TaskStatus } from "@/lib/types";

interface TaskStatusMenuProps {
  task: TaskResponse;
}

export function TaskStatusMenu({ task }: TaskStatusMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const updateStatus = useUpdateTaskStatus();

  const meta = TASK_STATUS_META[task.status];
  const transitions = ALLOWED_TRANSITIONS[task.status];

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleSelect(next: TaskStatus) {
    if (task.id == null) {
      return;
    }
    setOpen(false);
    updateStatus.mutate(
      { id: task.id, status: next },
      {
        onSuccess: () => toast.success("Estado actualizado correctamente."),
        onError: (error) =>
          toast.error(
            getApiErrorMessage(error, "No pudimos actualizar el estado."),
          ),
      },
    );
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={updateStatus.isPending}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Cambiar estado de la tarea "${task.title}"`}
        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity disabled:opacity-60 ${meta.badgeClass}`}
      >
        {updateStatus.isPending ? (
          <Loader className="size-3 animate-spin" aria-hidden="true" />
        ) : null}
        {meta.label}
        <ChevronDown className="size-3" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Cambiar estado"
          className="absolute right-0 z-50 mt-1 w-40 overflow-hidden rounded-lg border border-slate-700 bg-slate-800 shadow-xl"
        >
          {transitions.map((next) => (
            <button
              key={next}
              type="button"
              role="menuitem"
              onClick={() => handleSelect(next)}
              className="flex w-full items-center px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700/60 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
            >
              {TASK_STATUS_META[next].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
