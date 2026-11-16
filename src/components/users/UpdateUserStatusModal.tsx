"use client";

import { useEffect } from "react";
import { UserCheck, UserX, X } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/errors";
import { useUpdateUserStatus } from "@/hooks/mutations/useUpdateUserStatus";
import type { UserResponse } from "@/lib/types";

interface UpdateUserStatusModalProps {
  user: UserResponse;
  onClose: () => void;
}

// Se confirma porque desactivar a alguien le impide iniciar sesión.
export function UpdateUserStatusModal({
  user,
  onClose,
}: UpdateUserStatusModalProps) {
  const updateUserStatus = useUpdateUserStatus();

  const isActive = user.active !== false;
  const nextActive = !isActive;

  const title = nextActive ? "Activar usuario" : "Inactivar usuario";
  const Icon = nextActive ? UserCheck : UserX;
  const confirmLabel = nextActive ? "Activar" : "Inactivar";
  const successMessage = nextActive
    ? "Usuario activado correctamente."
    : "Usuario inactivado correctamente.";

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleConfirm() {
    if (user.id == null) {
      return;
    }

    updateUserStatus.mutate(
      { id: user.id, request: { active: nextActive } },
      {
        onSuccess: () => {
          toast.success(successMessage);
          onClose();
        },
        onError: (error) => {
          toast.error(
            getApiErrorMessage(
              error,
              "No pudimos actualizar el estado del usuario.",
            ),
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
        aria-label={title}
        className="animate-modal-in relative w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-800 p-6 shadow-xl"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            <Icon className="size-5 text-slate-300" aria-hidden="true" />
            {title}
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

        <p className="mt-1 text-sm text-slate-400">
          {user.name} · {user.email}
        </p>

        <p className="mt-4 text-sm text-slate-300">
          {nextActive
            ? "El usuario podrá volver a iniciar sesión con su contraseña actual."
            : "El usuario no podrá iniciar sesión hasta que lo actives de nuevo. Sus tareas no se modifican."}
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-700 px-4 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={updateUserStatus.isPending}
            className={
              nextActive
                ? "inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                : "inline-flex h-10 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 px-4 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:opacity-60"
            }
          >
            {updateUserStatus.isPending ? "Guardando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
