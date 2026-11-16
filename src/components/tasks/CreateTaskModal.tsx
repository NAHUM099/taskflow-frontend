"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Check, Search, X } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/errors";
import type { UserResponse } from "@/lib/types";
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

// Usuario con `id` garantizado: solo esos se pueden asignar.
type AssignableUser = UserResponse & { id: number };

// Búsqueda tolerante: sin distinguir mayúsculas ni acentos ("jose" encuentra "José").
function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function CreateTaskModal({ onClose }: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [userId, setUserId] = useState("");
  // Texto del buscador: solo tiene contenido mientras se escribe. Cuando no se
  // está buscando, el campo muestra el nombre del usuario asignado.
  const [userSearch, setUserSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isUserListOpen, setIsUserListOpen] = useState(false);
  const [activeUserIndex, setActiveUserIndex] = useState(0);
  const [errors, setErrors] = useState<FormErrors>({});
  const userListRef = useRef<HTMLDivElement>(null);

  const createTask = useCreateTask();
  const {
    data: usersData,
    isLoading: usersLoading,
    isError: usersError,
  } = useUsers({ page: 0, size: 100 });
  // El combo solo permite asignar usuarios con `id` (el backend lo envía
  // siempre; se filtra para no romper el tipado si llega null).
  const assignableUsers = useMemo(
    () =>
      (usersData?.content ?? []).filter(
        (user): user is AssignableUser => user.id !== null,
      ),
    [usersData],
  );

  // Filtrado en cliente: la lista ya viene cargada (100 usuarios), así que
  // escribir un nombre responde al instante y no dispara peticiones.
  const filteredUsers = useMemo(() => {
    const term = normalizeText(userSearch.trim());
    if (!term) {
      return assignableUsers;
    }
    return assignableUsers.filter((user) =>
      normalizeText(user.name).includes(term),
    );
  }, [assignableUsers, userSearch]);

  const selectedUser =
    assignableUsers.find((user) => String(user.id) === userId) ?? null;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Mantiene visible la opción activa cuando se navega con el teclado.
  useEffect(() => {
    if (!isUserListOpen) {
      return;
    }
    const activeOption = userListRef.current?.querySelector<HTMLElement>(
      `[data-index="${activeUserIndex}"]`,
    );
    activeOption?.scrollIntoView?.({ block: "nearest" });
  }, [activeUserIndex, isUserListOpen]);

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

  function cancelUserSearch() {
    // Al abandonar la búsqueda el campo vuelve a mostrar el usuario asignado.
    setIsSearching(false);
    setUserSearch("");
    setIsUserListOpen(false);
  }

  function selectUser(user: AssignableUser) {
    setUserId(String(user.id));
    // El nombre queda escrito en el propio campo: así se ve de un vistazo a
    // quién está asignada la tarea.
    setIsSearching(false);
    setUserSearch("");
    setIsUserListOpen(false);
    setErrors((current) => ({ ...current, userId: undefined }));
  }

  function handleUserSearchChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    const selectedName = selectedUser?.name ?? "";
    // El campo muestra el nombre elegido: lo que se escriba lo sustituye en
    // lugar de concatenarse detrás.
    const search =
      selectedName && value.includes(selectedName)
        ? value.replace(selectedName, "")
        : value;
    setIsSearching(true);
    setUserSearch(search);
    setActiveUserIndex(0);
    setIsUserListOpen(true);
  }

  function handleUserSearchFocus(event: FocusEvent<HTMLInputElement>) {
    setActiveUserIndex(0);
    setIsUserListOpen(true);
    // Sin texto de búsqueda se listan todos los usuarios; el nombre asignado
    // queda seleccionado para que escribir lo sustituya.
    if (!isSearching) {
      setUserSearch("");
      event.currentTarget.select();
    }
  }

  function handleUserListBlur(event: FocusEvent<HTMLDivElement>) {
    // Solo cierra si el foco sale del combo: elegir una opción no lo cierra.
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      cancelUserSearch();
    }
  }

  function handleUserSearchKeyDown(
    event: ReactKeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Escape") {
      // El modal escucha Escape en `document`: aquí solo cerramos la lista.
      if (isUserListOpen) {
        event.stopPropagation();
        cancelUserSearch();
      }
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!isUserListOpen) {
        setIsUserListOpen(true);
        return;
      }
      event.preventDefault();
      setActiveUserIndex((current) => {
        const total = filteredUsers.length;
        if (total === 0) {
          return 0;
        }
        const delta = event.key === "ArrowDown" ? 1 : -1;
        return (current + delta + total) % total;
      });
      return;
    }

    if (event.key === "Enter" && isUserListOpen) {
      const candidate = filteredUsers[activeUserIndex];
      if (candidate) {
        // Evita que Enter envíe el formulario mientras se elige responsable.
        event.preventDefault();
        selectUser(candidate);
      }
    }
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
            <div className="relative" onBlur={handleUserListBlur}>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              {selectedUser && (
                <Check
                  className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-indigo-300"
                  aria-hidden="true"
                />
              )}
              <input
                id="task-user"
                type="text"
                role="combobox"
                autoComplete="off"
                aria-expanded={isUserListOpen}
                aria-controls="task-user-list"
                aria-autocomplete="list"
                aria-activedescendant={
                  isUserListOpen && filteredUsers[activeUserIndex]
                    ? `task-user-option-${filteredUsers[activeUserIndex].id}`
                    : undefined
                }
                // El nombre del asignado se queda escrito en el campo; al
                // escribir se sustituye por el texto de búsqueda.
                value={isSearching ? userSearch : (selectedUser?.name ?? "")}
                onChange={handleUserSearchChange}
                onFocus={handleUserSearchFocus}
                // Tras elegir, el foco sigue en el input: un clic debe reabrir
                // la lista aunque no se dispare un nuevo `focus`.
                onClick={() => setIsUserListOpen(true)}
                // Conserva el nombre seleccionado para que escribir lo sustituya.
                onMouseUp={(event) => {
                  if (!isSearching) {
                    event.preventDefault();
                  }
                }}
                onKeyDown={handleUserSearchKeyDown}
                disabled={usersLoading || usersError}
                placeholder={
                  usersLoading
                    ? "Cargando usuarios…"
                    : usersError
                      ? "No se pudieron cargar los usuarios"
                      : "Buscar por nombre..."
                }
                className={`h-11 w-full rounded-lg border border-slate-700 bg-slate-900 pl-10 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60 ${
                  selectedUser ? "pr-10" : "pr-3"
                }`}
              />

              {isUserListOpen && !usersLoading && !usersError && (
                <div
                  id="task-user-list"
                  ref={userListRef}
                  role="listbox"
                  aria-label="Usuarios disponibles"
                  className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 p-1 shadow-xl"
                >
                  {filteredUsers.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-slate-400">
                      No hay usuarios que coincidan con la búsqueda.
                    </p>
                  ) : (
                    filteredUsers.map((user, index) => {
                      const isSelected = user.id === Number(userId);
                      // `aria-activedescendant` resalta la opción activa sin
                      // sacar el foco del input de búsqueda.
                      return (
                        <button
                          key={user.id}
                          id={`task-user-option-${user.id}`}
                          data-index={index}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          // Mantiene el foco en el buscador: sin esto, el blur
                          // puede cerrar la lista antes del clic (Safari).
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectUser(user)}
                          onMouseEnter={() => setActiveUserIndex(index)}
                          className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                            isSelected
                              ? "bg-indigo-500/10 text-white"
                              : index === activeUserIndex
                                ? "bg-slate-700/60 text-slate-100"
                                : "text-slate-200"
                          }`}
                        >
                          <span className="truncate">{user.name}</span>
                          {isSelected && (
                            <Check
                              className="size-4 shrink-0 text-indigo-300"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

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
