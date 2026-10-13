"use client";

import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/errors";
import { useUpdateUser } from "@/hooks/mutations/useUpdateUser";
import type { UserResponse } from "@/lib/types";

interface EditUserModalProps {
  user: UserResponse;
  onClose: () => void;
}

interface FormErrors {
  name?: string;
  email?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EditUserModal({ user, onClose }: EditUserModalProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [errors, setErrors] = useState<FormErrors>({});

  const updateUser = useUpdateUser();

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

    if (!name.trim()) {
      next.name = "El nombre es obligatorio.";
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      next.email = "El email es obligatorio.";
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      next.email = "Ingresa un email válido.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate() || user.id == null) {
      return;
    }

    updateUser.mutate(
      {
        id: user.id,
        request: { name: name.trim(), email: email.trim() },
      },
      {
        onSuccess: () => {
          toast.success("Usuario actualizado correctamente.");
          onClose();
        },
        onError: (error) => {
          toast.error(
            getApiErrorMessage(error, "No pudimos actualizar el usuario."),
          );
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
        aria-label="Editar usuario"
        className="animate-modal-in relative w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-800 p-6 shadow-xl"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-100">
            Editar usuario
          </h2>
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
              htmlFor="user-name"
              className="text-sm font-medium text-slate-300"
            >
              Nombre
            </label>
            <input
              id="user-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nombre del usuario"
              className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
            {errors.name && (
              <p className="text-xs text-red-300">{errors.name}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="user-email"
              className="text-sm font-medium text-slate-300"
            >
              Email
            </label>
            <input
              id="user-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="correo@ejemplo.com"
              className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
            {errors.email && (
              <p className="text-xs text-red-300">{errors.email}</p>
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
              disabled={updateUser.isPending}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updateUser.isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
