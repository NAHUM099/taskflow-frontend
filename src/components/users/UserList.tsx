import { Users } from "lucide-react";
import type { UserResponse } from "@/lib/types";
import { UserCard } from "./UserCard";

interface UserListProps {
  users: UserResponse[];
  searching: boolean;
  onEdit: (user: UserResponse) => void;
}

export function UserList({ users, searching, onEdit }: UserListProps) {
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-700/60 bg-slate-800 px-6 py-12 text-center">
        <Users className="size-8 text-slate-600" aria-hidden="true" />
        <p className="text-sm text-slate-400">
          {searching
            ? "No se encontraron usuarios para tu búsqueda."
            : "No hay usuarios registrados."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="hidden px-4 text-xs font-medium text-slate-500 sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:gap-4">
        <span>Usuario</span>
        <span>Email</span>
        <span className="justify-self-end">Acciones</span>
      </div>

      <ul className="flex flex-col gap-2">
        {users.map((user) => (
          <UserCard key={user.id ?? user.email} user={user} onEdit={onEdit} />
        ))}
      </ul>
    </div>
  );
}
