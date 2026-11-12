"use client";

import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/errors";
import { useCreateUser } from "@/hooks/mutations/useCreateUser";

interface CreateUserModalProps {
  onClose: () => void;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Espeja la validación del backend (CreateUserRequest: @Size(min = 6)).
const MIN_PASSWORD_LENGTH = 6;

export function CreateUserModal({ onClose }: CreateUserModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const createUser = useCreateUser();

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

    if (password.length < MIN_PASSWORD_LENGTH) {
      next.password = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    }

    if (!confirmPassword) {
      next.confirmPassword = "Confirma la contraseña.";
    } else if (confirmPassword !== password) {
      next.confirmPassword = "Las contraseñas no coinciden.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    // La contraseña se envía sin recortar: cambiar el valor elegido por el
    // usuario rompería sus credenciales sin avisar.
    createUser.mutate(
      { name: name.trim(), email: email.trim(), password },
      {
        onSuccess: () => {
          toast.success("Usuario creado correctamente.");
          onClose();
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error, "No pudimos crear el usuario."));
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
        aria-label="Crear usuario"
        className="animate-modal-in relative w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-800 p-6 shadow-xl"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-100">
            Nuevo usuario
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
              htmlFor="new-user-name"
              className="text-sm font-medium text-slate-300"
            >
              Nombre
            </label>
            <input
              id="new-user-name"
              type="text"
              autoComplete="off"
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
              htmlFor="new-user-email"
              className="text-sm font-medium text-slate-300"
            >
              Email
            </label>
            <input
              id="new-user-email"
              type="email"
              autoComplete="off"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="correo@ejemplo.com"
              className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
            {errors.email && (
              <p className="text-xs text-red-300">{errors.email}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="new-user-password"
              className="text-sm font-medium text-slate-300"
            >
              Contraseña
            </label>
            <input
              id="new-user-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
            {errors.password && (
              <p className="text-xs text-red-300">{errors.password}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="new-user-confirm-password"
              className="text-sm font-medium text-slate-300"
            >
              Confirmar contraseña
            </label>
            <input
              id="new-user-confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="••••••••"
              className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-300">{errors.confirmPassword}</p>
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
              disabled={createUser.isPending}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createUser.isPending ? "Creando..." : "Crear usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
