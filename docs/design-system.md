# Sistema de diseño — TaskFlow Frontend

> Detalle del sistema visual **vigente**, verificado en el código el **2026-10-11**.
> Este documento describe el estado actual, no un ideal: sirve para que cualquier cambio visual mantenga
> la coherencia. Las reglas obligatorias y el punto de entrada están en [../CLAUDE.md](../CLAUDE.md).
> Si el código y este documento entran en conflicto, **manda el código** (y se corrige este documento).

---

## 1. Principios observados

- **Tema oscuro único** ("Dark Slate"): fondo azul-grafito `#0f172a`, superficies `slate-800`/`slate-900`,
  acento **indigo** para acciones primarias y jerarquía de texto en cuatro niveles de `slate`.
- **Utility-first puro**: todos los estilos son clases Tailwind en el JSX. No hay CSS Modules, ni
  styled-components, ni un `.css` por componente; el único CSS global es `src/app/globals.css`.
- **Sin librería de componentes**: cada primitivo (botón, input, badge, modal) está implementado a mano y
  repetido en varios archivos (ver [technical-debt.md](./technical-debt.md)).
- Estética: bordes translúcidos (`/60`), radios generosos, sombras suaves, densidad compacta, iconografía
  de línea (`lucide-react`) con `strokeWidth={3}` solo en el logo.

---

## 2. Tokens existentes (`src/app/globals.css`)

```css
:root {
  --background: #0f172a;
  --foreground: #e2e8f0;
  color-scheme: dark;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-inter);
  --font-mono: var(--font-geist-mono);
}
```

Solo existen **2 tokens de color** y **2 de tipografía**. No hay tokens semánticos para superficie, borde,
acento, éxito, aviso o error: esos valores se escriben con clases utilitarias (`slate-800`, `indigo-600`,
`emerald-300`…) en cada componente.

---

## 3. Paleta en uso (clases reales)

| Rol | Clases | Notas |
| --- | --- | --- |
| Fondo de la app | `#0f172a` vía `body` | definido en `:root` |
| Texto base | `--foreground: #e2e8f0` | heredado del `body` |
| Superficie nav/header | `bg-slate-900`, `bg-slate-900/80 backdrop-blur-sm` | sidebar y header |
| Superficie de panel | `bg-slate-800` | tarjetas, modales, menús, estado vacío |
| Fila interactiva | `bg-slate-800/60` → `hover:bg-slate-800` | listas de tareas/usuarios |
| Borde estándar | `border-slate-700/60` (paneles), `border-slate-700` (controles) | 1px |
| Texto primario | `text-slate-100` | títulos, nombres, valores |
| Texto secundario | `text-slate-300` (labels), `text-slate-400` (descripciones) | — |
| Texto terciario | `text-slate-500`, `text-slate-600` | metadatos, iconos de estado vacío |
| Acento / acción | `bg-indigo-600` → `hover:bg-indigo-500`; `text-indigo-300/400`; `bg-indigo-500/10`, `bg-indigo-500/15` | botones, nav activo, avatar, logo |
| Foco | `ring-indigo-500/40` (inputs), `ring-indigo-400`/`ring-indigo-500` (botones) | — |
| Error | `text-red-300`, `border-red-500/30`, `bg-red-500/10` | alertas de formulario |
| Overlay | `bg-slate-950/60` | drawer y modales |
| Fantasma/deshabilitado | `disabled:opacity-50`, `disabled:opacity-60` | — |

**Estados de tarea** (única fuente: `TASK_STATUS_META` en `src/lib/task-status.ts`). No duplicar estos
colores en componentes nuevos:

| Estado | Clases del badge |
| --- | --- |
| `PENDING` | `bg-cyan-500/10 text-cyan-300 border-cyan-500/30` |
| `IN_PROGRESS` | `bg-amber-500/10 text-amber-300 border-amber-500/30` |
| `DONE` | `bg-emerald-500/10 text-emerald-300 border-emerald-500/30` |
| `CANCELLED` | `bg-rose-500/10 text-rose-300 border-rose-500/30` |

Los iconos de KPI usan `text-cyan-300`, `text-amber-300`, `text-emerald-300` y `text-slate-300` (total).

---

## 4. Tipografía

- **Inter** (`next/font/google`, variable `--font-inter`, subset `latin`) es la fuente sans y se aplica
  desde `body`; `Geist_Mono` (`--font-geist-mono`) está declarada como `--font-mono` pero **hoy no se usa**
  en ningún componente.
- `html` lleva `antialiased`; `body` es `min-h-full flex flex-col`.
- Escala observada:

| Tamaño | Uso |
| --- | --- |
| `text-xs` | badges, metadatos, breadcrumb, errores de campo, cabeceras de columna |
| `text-sm` | cuerpo principal: filas, labels, botones, inputs, descripciones |
| `text-base sm:text-lg` | título de página en el `Header` |
| `text-xl` | título de la tarjeta de login |
| `text-3xl` | valor numérico de los KPIs |

- Pesos: `font-medium` (botones, labels, ítems), `font-semibold` (títulos, KPI, logo), sin negritas
  mayores. `tracking-tight` en títulos y KPIs.
- Jerarquía de página: `Header` muestra breadcrumb (`text-xs text-slate-500` + `/` + `text-slate-400`) y
  título; los `*Header` de cada módulo añaden un subtítulo `text-sm text-slate-400`.

---

## 5. Espaciado

| Contexto | Valor |
| --- | --- |
| Contenedor de página (`main`) | `px-4 py-6 sm:px-6 lg:px-8` |
| Secciones apiladas | `flex flex-col gap-6` |
| Grid de KPIs | `gap-4` (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`) |
| Listas | `flex flex-col gap-2` |
| Formularios | `gap-4` entre campos; `gap-1.5` entre label y control |
| Padding de panel | `p-5` (KPI), `p-6` (modal), `p-8` (login) |
| Padding de fila | `px-4 py-3` |
| Estado vacío / error | `px-6 py-12` (`py-10` en *Tareas recientes*) |
| Alturas fijas | header `h-16`; inputs `h-11`; botones `h-10`; icon buttons `size-8`/`size-9`; avatar `size-8` |

---

## 6. Bordes, radios y sombras

| Elemento | Valor |
| --- | --- |
| Radio de controles, botones, inputs y menús | `rounded-lg` (8px) |
| Radio de filas, tarjetas de lista y logo del sidebar | `rounded-xl` (12px) |
| Radio de paneles, modales y estados vacíos | `rounded-2xl` (16px) |
| Radio de badges y avatar | `rounded-full` |
| Grosor de borde | `border` (1px) siempre |
| Sombra de modales, menús y drawer | `shadow-xl` |
| Sombra de la tarjeta de login | `shadow-xl shadow-black/20` |
| Sombra del logo | `shadow-sm shadow-indigo-600/30` (sidebar) / `shadow-lg shadow-indigo-600/30` (login) |

---

## 7. Inventario de componentes (clases canónicas)

| Componente | Implementación actual | Clases clave |
| --- | --- | --- |
| Botón primario | `<button>` inline en cada feature | `inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400` |
| Botón primario de formulario | submit de modal/login | `h-11 w-full rounded-lg bg-indigo-600 …` + `disabled:opacity-60` |
| Botón secundario | "Cancelar", "Reintentar" | `inline-flex h-10 items-center justify-center rounded-lg border border-slate-700 px-4 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700/60 focus-visible:ring-2 focus-visible:ring-indigo-500` |
| Botón-icono | cerrar modal, editar usuario, hamburguesa | `flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-indigo-500` |
| Botón destructivo | **no existe todavía** | — |
| Input de texto | login, título de tarea, nombre/email | `h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40` |
| Input de búsqueda | `/users` | estilo de input + `pl-10 pr-3` con icono `Search` absoluto en `left-3` |
| Select | modales (`h-11`) y filtro de tareas (`h-10`) | mismo estilo que el input (la diferencia de altura es una inconsistencia existente) |
| Textarea | descripción de tarea | `w-full resize-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm …` + `rows={4}` |
| Label | todos los formularios | `text-sm font-medium text-slate-300` |
| Error de campo | formularios | `text-xs text-red-300` |
| Badge de estado | `TaskStatusBadge`, disparador de `TaskStatusMenu` | `inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium` + clases de `TASK_STATUS_META` |
| Tarjeta KPI | `DashboardStats` | `rounded-2xl border border-slate-700/60 bg-slate-800 p-5`; valor `mt-3 text-3xl font-semibold tracking-tight` |
| "Tabla" de datos | `TaskList` / `UserList` (`<ul>` + grid, **no** `<table>`) | fila: `grid grid-cols-1 gap-2 rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-3 transition-colors hover:bg-slate-800 sm:grid-cols-[…] sm:items-center sm:gap-4`; cabecera: `hidden px-4 text-xs font-medium text-slate-500 sm:grid …` |
| Modal | `CreateTaskModal`, `EditUserModal` | contenedor `fixed inset-0 z-[60] flex items-center justify-center p-4`; overlay `<button aria-label="Cerrar modal">` con `absolute inset-0 bg-slate-950/60 animate-overlay-in`; panel `animate-modal-in relative w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-800 p-6 shadow-xl` |
| Menú desplegable | `TaskStatusMenu` y `UserMenu` (función interna de `Sidebar.tsx`) | `absolute z-50 overflow-hidden rounded-lg border border-slate-700 bg-slate-800 shadow-xl`; ítem `px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/60 hover:text-slate-100` |
| Toast | `Toaster` global (Sonner) | `position="top-right"`, `theme="dark"`, `richColors`, `closeButton`, clase `bg-slate-800 border border-slate-700/60 text-slate-100` |
| Estado vacío | `TaskList`, `UserList`, `RecentTasks` | `flex flex-col items-center gap-2/3 rounded-2xl border border-slate-700/60 bg-slate-800 px-6 py-12 text-center` + icono `size-8 text-slate-600` + `text-sm text-slate-400` |
| Estado de error | `DashboardContent`, `TasksContent`, `UsersContent` | mismo contenedor que el vacío pero con `justify-center gap-5` + `CircleAlert size-8 text-slate-500` + botón "Reintentar" con `RotateCw size-4` |
| Skeleton | los tres `*Content` | `animate-pulse rounded-xl`/`rounded-2xl border border-slate-700/60 bg-slate-800/60` |
| Spinner | `RequireAuth`, `TaskStatusMenu` | `size-5 animate-spin rounded-full border-2 border-slate-700 border-t-indigo-500` |
| Paginación | `UserPagination` | botones secundarios `h-9` + texto `text-sm text-slate-400` ("Página X de Y") + `ChevronLeft/Right` |

No existen hoy: `<table>` real, `<dialog>` nativo, tabs, acordeón, tooltips de iconos (solo el texto
flotante del sidebar colapsado), ni botones destructivos.

---

## 8. Navegación y shell (`src/components/layout/`)

- `DashboardShell`: `flex min-h-screen w-full`; columna izquierda = `Sidebar`, columna derecha = `Header`
  + `main` (`flex min-w-0 flex-1 flex-col`). Bloquea el scroll del `body` cuando el drawer está abierto.
- **Sidebar escritorio**: `sticky top-0 z-40 hidden h-screen shrink-0 flex-col border-r border-slate-700/60 bg-slate-900 transition-[width] duration-200 ease-in-out lg:flex`,
  con ancho `w-64` expandido y `w-[76px]` colapsado (estado en `DashboardShell`).
- **Drawer móvil** (`< lg`): `fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85%] flex-col border-r border-slate-700/60 bg-slate-900 shadow-xl transition-transform duration-200 ease-in-out`
  sobre overlay `fixed inset-0 z-40 bg-slate-950/60`; cierra con `Escape`, con el botón `X` y con clic en
  el overlay; ambos llevan `inert` cuando están cerrados.
- **Header**: `sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-700/60 bg-slate-900/80 px-4 backdrop-blur-sm sm:px-6`.
- **Ítem de navegación**: activo `bg-indigo-500/10 text-slate-100` con icono `text-indigo-400`; inactivo
  `text-slate-400 hover:bg-slate-800 hover:text-slate-200`. Colapsado muestra solo icono + etiqueta
  flotante (`pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150`).
- `src/lib/navigation.ts` es la **única fuente de navegación**: `navItems` (label, href, icono, roles
  visibles), `getVisibleNavItems(role)`, `isActivePath()`, `getSectionTitle()`.

---

## 9. Responsive y breakpoints

- Tailwind v4 con breakpoints por defecto; en el código **solo se usan** `sm` (640px, ~30 usos), `lg`
  (1024px, 5 usos) y `xl` (1280px, 2 usos). `md` y `2xl` no se usan actualmente.
- Patrón **mobile-first**: una columna por defecto; en `sm:` aparecen columnas que en móvil se ocultan
  (`hidden sm:block`) y cuyo dato se repite dentro de la celda principal (`sm:hidden`).
- El sidebar colapsable existe solo en `lg+`; el drawer solo por debajo de `lg`.
- Anchos máximos: `max-w-sm` (tarjeta de login), `sm:max-w-sm` (buscador de usuarios), `max-w-md`
  (modales), `max-w-[85%]` (drawer).
- Al añadir layouts nuevos: respetar `sm`/`lg`/`xl` como puntos de corte; no introducir `md`/`2xl` de
  forma aislada sin justificarlo.

---

## 10. Estados interactivos

| Estado | Patrón |
| --- | --- |
| Hover | Superficies suben un nivel (`bg-slate-800/60 → bg-slate-800`, `hover:bg-slate-700/60`); acento `indigo-600 → indigo-500`; iconos `text-slate-400 → text-slate-200` |
| Focus | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500` (`indigo-400` en botones de acento); inputs `focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40` |
| Active / selected | No hay estilos `active:` ni `aria-pressed`; la selección se expresa con `bg-indigo-500/10` (nav) o color de estado (badge) |
| Disabled | `disabled:cursor-not-allowed disabled:opacity-60` en los submits (login, `CreateTaskModal`, `EditUserModal`) y en el `<select>` de usuarios de `CreateTaskModal` mientras carga; `disabled:opacity-60` en el badge de `TaskStatusMenu` mientras actualiza; `disabled:cursor-not-allowed disabled:opacity-50` en `UserPagination` (`disabled={first \|\| isFetching}`) |
| Loading | Spinner + `animate-pulse` + textos explícitos: "Iniciando sesión…", "Cargando tareas…", "Creando…", "Guardando…" |

---

## 11. Animación y movimiento

- Keyframes propios en `src/app/globals.css`: `overlay-in` (0.15 s, ease-out) y `modal-in` (0.2 s,
  ease-out, `translateY(8px)` + `scale(0.97)`), expuestos como `animate-overlay-in` / `animate-modal-in`.
- Transiciones: `transition-colors` en casi todos los controles; `duration-200 ease-in-out` en drawer y
  ancho del sidebar; `duration-150` en las etiquetas flotantes.
- No hay `prefers-reduced-motion` implementado (mejora pendiente, ver
  [technical-debt.md](./technical-debt.md)).

---

## 12. Capas (z-index)

| Capa | Valor |
| --- | --- |
| Header sticky | `z-30` |
| Sidebar escritorio / overlay móvil | `z-40` |
| Drawer móvil, menús desplegables, etiquetas flotantes | `z-50` |
| Modales | `z-[60]` |

Mantener este orden al añadir capas nuevas; cualquier elemento superior a `z-[60]` debe justificarse.

---

## 13. Regla de consistencia visual

Todo cambio visual debe **reutilizar** los valores documentados aquí (colores, alturas, radios, sombras,
espaciados, breakpoints, transiciones). Si hace falta un valor nuevo:

1. Se define primero como **token** en `src/app/globals.css` (`@theme inline`) o se elige una utilidad
   existente.
2. Se usa de forma consistente en todos los puntos afectados; nunca un hex suelto ni una clase ad-hoc
   aplicada a un solo componente.

Cualquier desviación deliberada (nuevo patrón, cambio de paleta, rediseño) debe ser pedida por el
responsable del proyecto y reflejada en este documento en el mismo cambio.
