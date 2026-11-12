import { KeyRound, Pencil } from "lucide-react";
import type { UserResponse } from "@/lib/types";

interface UserCardProps {
  user: UserResponse;
  onEdit: (user: UserResponse) => void;
  onChangePassword: (user: UserResponse) => void;
}

export function UserCard({ user, onEdit, onChangePassword }: UserCardProps) {
  return (
    <li className="grid grid-cols-1 gap-2 rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-3 transition-colors hover:bg-slate-800 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-100">
          {user.name}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-500 sm:hidden">
          {user.email}
        </p>
      </div>

      <p className="hidden truncate text-sm text-slate-400 sm:block">
        {user.email}
      </p>

      <div className="flex items-center gap-1 sm:justify-self-end">
        <button
          type="button"
          onClick={() => onChangePassword(user)}
          aria-label={`Actualizar contraseña de ${user.name}`}
          className="inline-flex size-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <KeyRound className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onEdit(user)}
          aria-label={`Editar usuario ${user.name}`}
          className="inline-flex size-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <Pencil className="size-4" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}
