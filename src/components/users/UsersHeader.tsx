import { Plus } from "lucide-react";

interface UsersHeaderProps {
  onNewUser: () => void;
}

export function UsersHeader({ onNewUser }: UsersHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-400">Gestiona los usuarios de TaskFlow.</p>
      <button
        type="button"
        onClick={onNewUser}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        <Plus className="size-4" aria-hidden="true" />
        Nuevo usuario
      </button>
    </div>
  );
}
