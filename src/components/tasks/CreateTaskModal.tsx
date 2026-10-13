"use client";

import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/errors";
import { useCreateTask } from "@/hooks/mutations/useCreateTask";
import { useUsers } from "@/hooks/queries/useUsers";

interface CreateTaskModalProps {
  onClose: () => void;
}

interface FormErrors {
  title?: string;
  description?: string;
  userId?: string;
}

export function CreateTaskModal({ onClose }: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [userId, setUserId] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const createTask = useCreateTask();
  const {
    data: usersData,
    isLoading: usersLoading,
    isError: usersError,
  } = useUsers({ page: 0, size: 100 });
  const users = usersData?.content ?? [];

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function validate(): boolean {
    const next: FormErrors = {};

    if (!title.trim()) {
      next.title = "El título es obligatorio.";
    }

    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      next.description = "La descripción es obligatoria.";
    } else if (trimmedDescription.length < 5) {
      next.description = "La descripción debe tener al menos 5 caracteres.";
    } else if (trimmedDescription.length > 200) {
      next.description = "La descripción no debe superar 200 caracteres.";
    }

    if (!userId) {
      next.userId = "Selecciona un usuario.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    createTask.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        userId: Number(userId),
      },
      {
        onSuccess: () => {
          toast.success("Tarea creada correctamente.");
          onClose();
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error, "No pudimos crear la tarea."));
        },
      },
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar modal"
        onClick={onClose}
        className="animate-overlay-in absolute inset-0 cursor-default bg-slate-950/60"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Crear tarea"
        className="animate-modal-in relative w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-800 p-6 shadow-xl"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-100">Nueva tarea</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col gap-4"
          noValidate
        >
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="task-title"
              className="text-sm font-medium text-slate-300"
            >
              Título
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Título de la tarea"
              className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
            {errors.title && (
              <p className="text-xs text-red-300">{errors.title}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="task-description"
              className="text-sm font-medium text-slate-300"
            >
              Descripción
            </label>
            <textarea
              id="task-description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Descripción de la tarea"
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
            {errors.description && (
              <p className="text-xs text-red-300">{errors.description}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="task-user"
              className="text-sm font-medium text-slate-300"
            >
              Usuario asignado
            </label>
            <select
              id="task-user"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              disabled={usersLoading || usersError}
              className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60"
            >
              <option value="">
                {usersLoading
                  ? "Cargando usuarios…"
                  : usersError
                    ? "No se pudieron cargar los usuarios"
                    : "Selecciona un usuario"}
              </option>
              {users.map(
                (user) =>
                  user.id !== null && (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ),
              )}
            </select>
            {usersError && (
              <p className="text-xs text-red-300">
                No pudimos cargar los usuarios para asignar la tarea.
              </p>
            )}
            {errors.userId && (
              <p className="text-xs text-red-300">{errors.userId}</p>
            )}
          </div>

          <div className="mt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-700 px-4 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createTask.isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createTask.isPending ? "Creando..." : "Crear tarea"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
