# Contratos de API — TaskFlow Frontend

> Lo que el frontend consume y lo que el backend impone, leído del repositorio `taskflow-api` el
> **2026-10-11**. Fuente de verdad: el backend. **No modificar el backend.**
> Punto de entrada: [../CLAUDE.md](../CLAUDE.md). Capas y servicios: [architecture.md](./architecture.md).

---

## 1. Endpoints que consume el frontend

| Método | Ruta | Servicio | Consumidor | Notas |
| --- | --- | --- | --- | --- |
| `POST` | `/auth/login` | `login()` (`src/lib/auth/auth-service.ts`) | `LoginForm` | Público. Body `{ email, password }` → `{ token }` |
| `GET` | `/tasks?status&userId` | `getTasks()` (`src/lib/services/task-service.ts`) | `useTasks` → `DashboardContent`, `TasksContent` | Ambos filtros opcionales |
| `POST` | `/tasks` | `createTask()` | `useCreateTask` → `CreateTaskModal` | La UI lo muestra solo a `ROLE_ADMIN` |
| `PATCH` | `/tasks/{id}/status` | `updateTaskStatus()` | `useUpdateTaskStatus` → `TaskStatusMenu` | Body `{ status }` |
| `GET` | `/users?page&size&search` | `getUsers()` (`src/lib/services/user-service.ts`) | `useUsers` → `UsersContent`, `CreateTaskModal` | Solo `ROLE_ADMIN` |
| `PATCH` | `/users/{id}` | `updateUser()` | `useUpdateUser` → `EditUserModal` | Body `{ name, email }`; solo `ROLE_ADMIN` |
| `POST` | `/users` | `createUser()` | `useCreateUser` → `CreateUserModal` | Público en el backend; la UI lo muestra solo a `ROLE_ADMIN`. Body `{ name, email, password }` (mín. 6); rol forzado a `USER` |

---

## 2. Endpoints existentes en el backend **no** utilizados todavía

- `GET /users/{id}` — detalle de usuario.
- `PATCH /users/{id}/status` — activar/desactivar usuario.
- `PATCH /users/me/password` — cambio de contraseña (queda bajo `/users/**`, es decir, **solo ADMIN**).
- `DELETE /users/{id}` — eliminación.
- `GET /users/{id}/tasks` — tareas de un usuario.

---

## 3. Reglas de seguridad del backend (`SecurityConfig.kt`)

| Regla | Efecto en el frontend |
| --- | --- |
| `POST /auth/login` y `POST /users` → `permitAll` | Públicos; la UI solo ofrece el alta de usuarios a `ADMIN` |
| `/users/**` → `hasRole("ADMIN")` | **Todo** el módulo de usuarios exige ADMIN, incluido `/users/me/password` |
| `POST /tasks` → `ADMIN` o `MODERATOR` | Un `MODERATOR` **puede** crear tareas por API, pero la UI solo muestra el botón a ADMIN |
| Cualquier otra ruta → autenticado | Requiere JWT válido |
| CORS | `http://localhost:3000` y `https://taskflow-frontend-ashen.vercel.app` |

**Inconsistencias conocidas (no corregir aquí, solo tenerlas presentes):** un `MODERATOR` recibiría `403`
al abrir el modal de creación de tareas, porque `CreateTaskModal` carga usuarios con `GET /users`
(ADMIN-only); y `PATCH /users/me/password` no es accesible a usuarios normales pese a ser su propia
contraseña.

---

## 4. Formas de datos

```text
TaskResponse        { id: number|null, title, description, status, userId: number|null, userName, createdAt }
CreateTaskRequest   { title, description, userId }
StatusRequest       { status }
UserResponse        { id: number|null, name, email, active }     # el backend SÍ envía "active"
CreateUserRequest   { name, email, password }                   # password: @Size(min = 6); rol forzado USER
UpdateUserRequest   { name, email }
Page<UserResponse>  { content, totalElements, totalPages, number, size, first, last,
                      numberOfElements, empty, … }
ErrorResponse       { timestamp, status, message, path, details } # el frontend solo lee "message"
```

`src/lib/types.ts` declara hoy `UserResponse` **sin** `active`: es una divergencia conocida entre el
contrato y el modelo del frontend (ver [technical-debt.md](./technical-debt.md)).

Estados de tarea: `PENDING`, `IN_PROGRESS`, `DONE`, `CANCELLED`. Las transiciones válidas están
espejadas en `src/lib/task-status.ts` (`ALLOWED_TRANSITIONS`) y las impone el backend; si divergen,
manda el backend.

---

## 5. Reglas al tocar datos

- No inventar campos ni endpoints. Si se necesita un dato nuevo (p. ej. `active` o `role`),
  **verificarlo primero en el backend** y luego extender `src/lib/types.ts` + el servicio correspondiente.
- `createdAt` llega como string ISO y **hoy no se muestra en la UI**; no formatear fechas a mano dentro de
  un componente sin un helper compartido.
- Tipos `id: number | null` obligan a comprobaciones de nulidad antes de usarlos como key o en URLs.
- Ninguna URL de API se escribe fuera de `src/lib/services/*-service.ts`.

---

## 6. Pendiente de confirmar (contratos)

- Cobertura real de los tests del backend y política definitiva de creación de tareas: el `README` indica
  que `POST /tasks` limita por rol admin/mod en el backend, mientras la UI restringe el alta a ADMIN.
- Estrategia de despliegue del frontend más allá del CI de Jenkins (`vercel.app` aparece en CORS pero no
  hay configuración de despliegue versionada).

El seguimiento de estos puntos y del resto de riesgos está centralizado en
[technical-debt.md](./technical-debt.md).
