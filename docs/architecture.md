# Arquitectura — TaskFlow Frontend

> Detalle técnico de la arquitectura vigente, verificado en el código el **2026-10-11**.
> Punto de entrada y reglas obligatorias: [../CLAUDE.md](../CLAUDE.md).
> Contratos HTTP: [api-contracts.md](./api-contracts.md). Deuda y riesgos: [technical-debt.md](./technical-debt.md).

---

## 1. Vista general y límites

**TaskFlow** es una app web de gestión de tareas y usuarios (SaaS de demostración / pieza de portafolio).
Este repositorio contiene **únicamente el frontend**; consume una API REST en Kotlin + Spring Boot que
vive en otro repositorio.

```text
[Navegador]
  Next.js 16 (App Router) · React 19 · Tailwind CSS 4
    page.tsx (Server) → *Content (Client) → hooks React Query → services (Axios) → lib/api.ts
        │
        ▼  HTTP/JSON + Authorization: Bearer <JWT>
[API REST — Spring Boot 3.5 + PostgreSQL]   ← otro repositorio, solo lectura
```

- Todo el renderizado de datos ocurre en el **cliente**: las `page.tsx` son Server Components que solo
  componen un componente cliente (`*Content`); las peticiones salen desde React Query en el navegador.
- **No** hay BFF, ni Route Handlers de Next, ni middleware de sesión.
- El JWT se guarda en `localStorage` y se inyecta mediante un interceptor de Axios.

| Repositorio | Ruta local | Remoto | Permiso |
| --- | --- | --- | --- |
| Frontend | `C:\SPRING-KOTLIN\taskflow-frontend` | `github.com/NAHUM099/taskflow-frontend` | **Aquí sí se trabaja** |
| Backend | `C:\SPRING-KOTLIN\taskflow-api\taskflow-api` | `github.com/NAHUM099/taskflow-api` | **Solo lectura**: se puede leer para respetar contratos, **nunca** modificar |

---

## 2. Estructura de carpetas

```text
src/
├─ app/                            # App Router
│  ├─ layout.tsx                   # RootLayout: fuentes, AuthProvider + QueryProvider, <Toaster/>, metadata
│  ├─ globals.css                  # @import "tailwindcss" + tokens + keyframes de modales
│  ├─ favicon.ico
│  ├─ login/page.tsx               # /login  (server component, metadata propia)
│  └─ (dashboard)/                 # route group: NO añade segmento a la URL
│     ├─ layout.tsx                # RequireAuth + DashboardShell
│     ├─ page.tsx                  # /
│     ├─ tasks/page.tsx            # /tasks
│     └─ users/page.tsx            # /users  (RequireAdmin + UsersContent)
├─ components/
│  ├─ auth/                        # LoginForm, RequireAuth, RequireAdmin
│  ├─ dashboard/                   # DashboardContent, DashboardStats, RecentTasks, TaskRow
│  ├─ layout/                      # DashboardShell, Header, Sidebar
│  ├─ providers/                   # QueryProvider
│  ├─ tasks/                       # TasksContent, TasksHeader, TaskFilters, TaskList, TaskCard,
│  │                               # TaskStatusBadge, TaskStatusMenu, CreateTaskModal
│  └─ users/                       # UsersContent, UsersHeader, UserList, UserCard,
│                                  # UserPagination, EditUserModal, CreateUserModal
├─ context/AuthContext.tsx         # AuthProvider + useAuth
├─ hooks/
│  ├─ queries/                     # useTasks, useUsers
│  └─ mutations/                   # useCreateTask, useUpdateTaskStatus, useUpdateUser, useCreateUser
└─ lib/
   ├─ api.ts                       # instancia única de Axios + interceptores
   ├─ errors.ts                    # getApiErrorMessage (mapeo HTTP → mensaje en español)
   ├─ navigation.ts                # navItems + getVisibleNavItems + isActivePath + getSectionTitle
   ├─ query-keys.ts                # taskKeys / userKeys
   ├─ task-status.ts               # TASK_STATUS_META + ALLOWED_TRANSITIONS
   ├─ types.ts                     # tipos de dominio/API
   ├─ auth/                        # auth-service.ts, token.ts, types.ts
   └─ services/                    # task-service.ts, user-service.ts
```

**Regla de organización:** agrupación **por dominio funcional** (`tasks/`, `users/`, `dashboard/`,
`layout/`, `auth/`), no por tipo de archivo. No reorganizar a una estructura `features/*` sin aprobación.

---

## 3. Rutas y layouts

| URL | Archivo | Guard (cliente) | Contenido |
| --- | --- | --- | --- |
| `/login` | `src/app/login/page.tsx` | inverso: si hay sesión redirige a `/` | Formulario de login |
| `/` | `src/app/(dashboard)/page.tsx` | `RequireAuth` | KPIs + 5 tareas recientes |
| `/tasks` | `src/app/(dashboard)/tasks/page.tsx` | `RequireAuth` | Filtro, listado, alta (ADMIN) y cambio de estado |
| `/users` | `src/app/(dashboard)/users/page.tsx` | `RequireAuth` + `RequireAdmin` | Búsqueda, paginación y edición |

No existen: `middleware.ts`, `error.tsx`, `global-error.tsx`, `not-found.tsx`, `loading.tsx`, Route
Handlers (`route.ts`) ni Server Actions.

### Enrutamiento y composición

- **App Router** con *route groups*: `(dashboard)` agrupa las rutas privadas y aporta el layout con
  sidebar/header sin añadir segmento a la URL.
- Anidamiento: `RootLayout` (html/body, providers, Toaster) → `(dashboard)/layout.tsx`
  (`RequireAuth` + `DashboardShell`) → página.
- Las `page.tsx` son Server Components mínimos (importan y renderizan el `*Content`) y exportan
  `metadata` cuando aporta valor (`/login` define `title: "Iniciar sesión"`).
- `RootLayout` usa `LayoutProps<"/">` (tipado global de rutas de Next 16) y define
  `title.default = "TaskFlow"` con `template = "%s · TaskFlow"`.
- Navegación con `next/link` y `usePathname()` para el estado activo (`aria-current="page"`);
  redirecciones programáticas con `router.replace()` de `next/navigation`.

---

## 4. Archivos de configuración

| Archivo | Qué define |
| --- | --- |
| `package.json` | Scripts `dev`/`build`/`start`/`lint`; dependencias (ver stack en CLAUDE.md) |
| `tsconfig.json` | `strict`, `noEmit`, `isolatedModules`, alias `@/* → ./src/*`, plugin de Next |
| `next.config.ts` | `reactCompiler: true` (única opción configurada) |
| `postcss.config.mjs` | Solo `@tailwindcss/postcss` (Tailwind v4, sin `tailwind.config.*`) |
| `eslint.config.mjs` | Flat config: `eslint-config-next/core-web-vitals` + `/typescript`; ignora `.next`, `out`, `build`, `next-env.d.ts` |
| `.env.local` | `NEXT_PUBLIC_API_URL` (ignorado por git; **no se versiona ni se modifica sin autorización**) |
| `.gitignore` | Ignora `node_modules`, `.next`, `.env*`, `*.tsbuildinfo`, etc. |
| `Jenkinsfile` | CI: `npm ci` y `npm run build` con Node 22 (no ejecuta lint ni tests) |
| `AGENTS.md` | Archivo **administrado por `next dev`** (bloque `BEGIN/END:nextjs-agent-rules`). No editar a mano |
| `CLAUDE.md` | Punto de entrada para agentes. `next dev` nunca lo reescribe |

---

## 5. Capas y flujo de una petición

```text
Componente cliente (*Content / *Modal)
  → hook (hooks/queries/use*.ts | hooks/mutations/use*.ts)
    → service (lib/services/*-service.ts)
      → api (lib/api.ts: instancia única de Axios + interceptores)
        → API REST (NEXT_PUBLIC_API_URL)
```

Reglas obligatorias de la capa de datos:

1. **Ningún componente llama a `api` directamente**: siempre a través de un hook de React Query.
2. **Ningún hook conoce URLs**: las rutas viven en `lib/services/*-service.ts`.
3. Toda query usa una key de `lib/query-keys.ts` (`*Keys.all` / `*Keys.list(params)`).
4. Toda mutation invalida el dominio en `onSuccess`
   (`queryClient.invalidateQueries({ queryKey: taskKeys.all })`). No hay actualizaciones optimistas.
5. Los mensajes de error salen de `getApiErrorMessage(error, fallback)` y el feedback usa
   `toast.success/error` de Sonner.

**Providers** (`src/app/layout.tsx`): `AuthProvider` (sesión) envolviendo `QueryProvider` (React Query);
`<Toaster />` de Sonner se monta una sola vez en el root.

---

## 6. Gestión de estado

| Tipo de estado | Mecanismo | Dónde |
| --- | --- | --- |
| Sesión (token + usuario) | `Context` + `useSyncExternalStore` sobre `localStorage` | `context/AuthContext.tsx` + `lib/auth/token.ts` |
| Estado del servidor (tareas, usuarios) | TanStack React Query | `hooks/queries`, `hooks/mutations` |
| Estado de UI (filtro, modales, página, búsqueda) | `useState` local | `TasksContent`, `UsersContent`, `DashboardShell`, … |

Detalles de la sesión:

- Token en `localStorage` bajo la clave **`taskflow.token`**, encapsulada en `lib/auth/token.ts`.
- Al escribir/borrar el token se emite el evento `taskflow:token-change`; `AuthContext` se suscribe y
  además escucha el evento `storage` (sincronización entre pestañas).
- `getServerTokenSnapshot()` devuelve `null` → en SSR siempre se renderiza sin sesión; `isLoading` se
  resuelve en cliente con un `useSyncExternalStore` de hidratación (`isLoading = !isHydrated`).
- El `user` se deriva decodificando el JWT (`sub` = email, `role`), no de una llamada al backend;
  `isAuthenticated = user !== null`.
- `QueryProvider` crea un único `QueryClient` con `retry: 1`, `refetchOnWindowFocus: false`,
  `staleTime: 30_000`.

---

## 7. Autenticación y autorización (lado frontend)

- Login: `POST /auth/login` → `{ token }`. `LoginForm` llama a `login(token)` del `AuthContext`, que
  **decodifica el JWT** (`decodeToken`) y solo lo guarda si contiene `sub`; después redirige a `/`.
- Guards **solo de cliente**:
  - `RequireAuth`: mientras `isLoading` muestra un spinner; sin sesión → `router.replace("/login")`.
  - `RequireAdmin`: sin `ROLE_ADMIN` → `router.replace("/")`.
  - El menú lateral filtra opciones por rol con `getVisibleNavItems(role)` (`lib/navigation.ts`).
- **La autorización real vive en el backend**; los guards son solo UX. Nunca asumir que ocultar UI
  protege un endpoint.
- Roles: `ROLE_USER`, `ROLE_MODERATOR`, `ROLE_ADMIN`; etiquetas y helpers en `lib/auth/types.ts`
  (`ROLE_LABELS`). Comparar contra el rol técnico, nunca contra el texto traducido.

---

## 8. Formularios

- Formularios **controlados** con `useState` (un estado por campo) + `validate()` manual que devuelve un
  objeto de errores por campo (`FormErrors`), renderizado como `<p className="text-xs text-red-300">`.
- `LoginForm` usa validación nativa (`required`, `type="email"`) y muestra el error general con
  `role="alert"`.
- Los modales envían con `mutation.mutate(payload, { onSuccess, onError })`; el submit se deshabilita con
  `isPending` y cambia su texto (`"Creando..."`, `"Guardando..."`).
- **No** hay librería de formularios ni esquemas compartidos: cada formulario define sus reglas (ver
  [technical-debt.md](./technical-debt.md)).

---

## 9. Manejo de errores

| Contexto | Patrón actual |
| --- | --- |
| Error de red/HTTP en mutación | `toast.error(getApiErrorMessage(error, fallback))` |
| Error al cargar una lista | Estado de error en el `*Content` (`CircleAlert` + botón "Reintentar" con `refetch()`) |
| 401 (sesión inválida/expirada) | El interceptor borra el token → `AuthContext` pierde la sesión → `RequireAuth` redirige a `/login` |
| 403 | No cierra sesión; se propaga el error para mostrar el mensaje de autorización |

`getApiErrorMessage` traduce por status: `400` datos inválidos (usa `message` del backend), `401` sesión
expirada, `403` sin permisos, `404`/`409` usan `message` del backend, `500` error del servidor; sin
respuesta → "No pudimos conectar con el servidor."

---

## 10. Componentes: server vs client

- `"use client"` **solo** en el punto de entrada cliente de cada rama del árbol. Hoy lo declaran
  exactamente 15 archivos: `LoginForm`, `RequireAuth`, `RequireAdmin`, `DashboardShell`, `Header`,
  `Sidebar`, `QueryProvider`, `AuthContext`, `DashboardContent`, `TasksContent`, `CreateTaskModal`,
  `TaskStatusMenu`, `UsersContent`, `EditUserModal`, `CreateUserModal`.
- El resto de componentes (`TaskCard`, `TaskList`, `TasksHeader`, `TaskFilters`, `TaskStatusBadge`,
  `TaskRow`, `RecentTasks`, `DashboardStats`, `UserCard`, `UserList`, `UsersHeader`, `UserPagination`) son
  **componentes cliente por transitividad**: no llevan la directiva porque siempre se importan desde un
  archivo que sí la declara. Si alguno se importara desde un Server Component, habría que añadirle
  `"use client"`.
- Las `page.tsx`, `layout.tsx` y `lib/**` no llevan `"use client"`.
- Patrón de composición: el `*Content` es el único que llama hooks de datos; los hijos reciben props
  explícitas tipadas y no acceden a React Query (excepciones actuales: `RecentTasks` y `TaskStatusMenu`,
  que sí usan sus propios hooks).

---

## 11. Datos y mutaciones (React Query)

- Queries: `useQuery({ queryKey, queryFn })`; los filtros/params entran en la key para cachear por
  combinación.
- Mutations: `useMutation({ mutationFn })` y el consumidor decide `onSuccess`/`onError`; la invalidación
  se centraliza en el hook (`invalidateQueries` sobre `*Keys.all`).
- Nunca `useEffect` + `fetch` manual para datos del servidor; `useEffect` se reserva para efectos de
  UI/teclado/scroll y suscripciones.

---

## 12. Accesibilidad (patrones ya establecidos)

- Iconos decorativos con `aria-hidden="true"`; botones-icono con `aria-label` descriptivo.
- Modales y drawer: `role="dialog"` + `aria-modal="true"` + `aria-label`; overlay como `<button>` con
  `aria-label`; cierre con `Escape` y clic fuera.
- Drawer móvil oculto con `inert` (no recibe foco cuando está cerrado).
- Enlace activo con `aria-current="page"`; menús con `aria-haspopup="menu"` + `aria-expanded`.
- Foco visible con `focus-visible:ring-2` (nunca se elimina el outline sin reemplazarlo).
- **Carencia conocida**: sin focus trap, sin foco inicial y sin `aria-invalid`/`aria-describedby`
  (ver [technical-debt.md](./technical-debt.md)).

