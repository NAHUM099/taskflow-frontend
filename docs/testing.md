# Testing — TaskFlow Frontend

> Estado **actual** verificado el **2026-10-11**. Punto de entrada: [../CLAUDE.md](../CLAUDE.md).
> Arquitectura bajo prueba: [architecture.md](./architecture.md). Deuda pendiente: [technical-debt.md](./technical-debt.md).

---

## 1. Stack de pruebas

| Pieza | Paquete | Versión | Rol |
| --- | --- | --- | --- |
| Runner | `vitest` | 5.1.0 | Ejecuta y agrupa los tests; soporta TS/ESM sin Babel |
| DOM | `jsdom` | 31.0.0 | `window`, `localStorage`, eventos |
| Bundler de tests | `vite` | 8.3.8 | Resolución del alias `@/*` y transformación |
| Render/queries | `@testing-library/react` + `@testing-library/dom` | 16.3.3 / 10.4.2 | Render con `act` y queries accesibles |
| Interacción | `@testing-library/user-event` | 14.6.9 | Clics, teclado y `selectOptions` realistas |
| Matchers | `@testing-library/jest-dom` | 7.0.1 | `toBeInTheDocument`, `toBeDisabled`, `toHaveClass`… |
| Cobertura | `@vitest/coverage-v8` | 5.1.0 | Reporte `text`, `html` y `lcov` en `coverage/` |

**Requisitos:** Node **≥ 22.12** (lo exige Vitest 5 y es la versión del CI `NodeJS22`). No hay Jest, Babel
de pruebas ni MSW: se mockea en el borde (servicio o `@/lib/api`), nunca React Query.

---

## 2. Comandos

| Acción | Comando | Notas |
| --- | --- | --- |
| Ejecutar la suite una vez | `npm run test` | Falla si algún test falla |
| Modo vigilancia | `npm run test:watch` | Reejecuta los archivos afectados |
| Cobertura | `npm run test:coverage` | Aplica los umbrales de §6 |
| Igual que el CI | `npm run test:ci` | Añade `coverage/junit.xml` para Jenkins |
| Un archivo | `npx vitest run src/lib/errors.test.ts` | Filtro por ruta |
| Un test concreto | `npx vitest run -t "getApiErrorMessage"` | Filtro por nombre |

---

## 3. Dónde viven los tests

**Colocalización estricta**: `X.ts` → `X.test.ts`; `X.tsx` → `X.test.tsx`, en la misma carpeta.

```
src/
├─ lib/
│  ├─ errors.ts
│  ├─ errors.test.ts
│  ├─ auth/
│  │  ├─ token.ts
│  │  └─ token.test.ts
│  └─ services/
│     └─ task-service.test.ts
├─ hooks/queries/useTasks.test.tsx
├─ context/AuthContext.test.tsx
├─ components/
│  ├─ tasks/TaskCard.test.tsx
│  ├─ dashboard/DashboardContent.test.tsx
│  └─ layout/
│     ├─ Sidebar.test.tsx
│     └─ DashboardShell.test.tsx
└─ test/                      # utilidades + flujos de integración
   ├─ render.tsx              # renderWithProviders / createTestQueryClient
   ├─ factories.ts            # makeTask / makeUser / makeUserPage / makeJwt
   ├─ axios.ts                # responseError / networkError / stubApiStatus
   ├─ navigation.ts           # routerMock + navigationMock + setPathname
   └─ flows/auth-flow.test.tsx  # token → API 401 → guard (única excepción a la colocalización)
```

Reglas:

- **No** carpetas `__tests__`, **no** `*.spec.*`: una sola convención.
- Los tests no se importan desde código de aplicación: nunca entran al bundle.
- `src/test/**` y `*.test.*` están excluidos de la cobertura.
- La única excepción a la colocalización es `src/test/flows/*.test.tsx`: escenarios que cruzan
  tres o más capas (token → `api` → `AuthContext` → `RequireAuth`) y no pertenecen a un solo archivo.

---

## 4. Receta para un test nuevo

1. **Elegir el nivel más bajo posible**: helper puro → servicio → hook → componente.
2. **Preparar datos con factories**, no literales sueltos: `makeTask({ status: "DONE" })`.
3. **Mockear en el borde** según §5.
4. **Consultar por rol o etiqueta**: `getByRole("button", { name: "Crear tarea" })`,
   `getByLabelText("Descripción")`. Evitar `data-testid` y clases CSS.
5. **Afirmar comportamiento**, no implementación: texto visible, llamadas al servicio, navegación.
6. **Cubrir el camino triste**: validación, error del backend (`responseError(...)`) y estado vacío.

Para componentes con datos se usa `renderWithProviders`, que replica el árbol real
(`AuthProvider` → `QueryClientProvider`) con `retry: false` y `gcTime: 0`:

```tsx
renderWithProviders(<TasksContent />);
```

Para hooks se usa `renderHook` con `createProvidersWrapper(queryClient)`.

---

## 5. Qué se mockea (y qué no)

| Bajo prueba | Se mockea | Cómo |
| --- | --- | --- |
| `src/lib/*` puro | nada | — |
| `src/lib/services/*` | `@/lib/api` | `vi.mock("@/lib/api", () => ({ api: { get, post, patch } }))` |
| `src/hooks/*` | el servicio | `vi.mock("@/lib/services/...")` + `QueryClientProvider` **real** |
| Componentes con datos | hooks de query/mutation | `vi.mock("@/hooks/...")` |
| Navegación | `next/navigation` | `vi.mock("next/navigation", async () => (await import("@/test/navigation")).navigationMock)` |
| Toasts | `sonner` | `vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))` |
| `RequireAuth` (unitario) | `@/context/AuthContext` | `useAuth` stubeado para probar los 3 estados; el flujo real va en `src/test/flows` |
| `@/lib/api` (flujo) | solo la respuesta HTTP | `stubApiStatus(api, 401)` cambia el adapter y `restoreApiAdapter(api)` lo devuelve |

**No** se mockean `@tanstack/react-query` ni `axios` globalmente, ni `AuthContext` cuando el test
necesita una sesión real (`setToken(...)` + `AuthProvider`).

---

## 6. Cobertura y umbrales

Umbrales configurados en `vitest.config.mts` (el comando de cobertura falla si no se cumplen):

| Ámbito | Líneas | Sentencias | Funciones | Ramas |
| --- | --- | --- | --- | --- |
| Global (todo `src/`, sin `app/`) | 95 | 95 | 90 | 90 |
| `src/lib/**` | 95 | 95 | 95 | 90 |
| `src/hooks/**` | 100 | 100 | 100 | 100 |
| `src/components/**` | 90 | 90 | 85 | 85 |
| `src/components/dashboard/**` | 100 | 100 | 100 | 85 |
| `src/components/layout/**` | 95 | 95 | 90 | 90 |

Exclusiones: `src/app/**` (archivos de ruta de 1–2 líneas), `src/test/**`, `*.test.*`, `src/lib/types.ts`
(solo interfaces), `*.d.ts` y `src/components/providers/QueryProvider.tsx` (solo configura `staleTime`/`retry`:
probar el cliente de React Query no da señal sobre nuestro código).

Cobertura real al cierre (189 tests, 34 archivos):

| Área | Líneas | Ramas |
| --- | --- | --- |
| `src/lib` (incluye `auth` y `services`) | 100 % | 100 % |
| `src/hooks` | 100 % | 100 % |
| `src/context` | 96 % (`AuthContext` sin cubrir la rama SSR) | 96 % |
| `src/components/auth` | 100 % | 100 % |
| `src/components/dashboard` | 100 % | 90 % (fallback `id ?? title` en `RecentTasks`) |
| `src/components/layout` | 98 % | 97 % (`Mi perfil` y el `id` del enlace) |
| `src/components/tasks` | 98 % | 94 % |
| `src/components/users` | 95 % | 95 % |
| **Global** | **98 %** | **97 %** |

Líneas que quedan sin cubrir a propósito (no son huecos accidentales):

- `Sidebar.tsx` L300: `onClick` del botón **"Mi perfil"**, que no navega a ningún sitio (deuda #15).
- `RecentTasks.tsx` L24: rama `task.id ?? task.title` del `key` (contrato `id: number | null`, deuda #20).
- `AuthContext.tsx` L46: `getServerTokenSnapshot` (solo se ejecuta en el render de servidor de Next).

---

## 7. Trampas conocidas

1. **Fake timers + React 19**: `vi.useFakeTimers()` bloquea el scheduler y cuelga `userEvent`. Para el
   debounce de `UsersContent` se usan timers reales con `waitFor(..., { timeout: 2000 })`. El debounce solo
   arma el timer si el texto recortado cambia (`UsersContent.test.tsx` lo cubre con
   "no reinicia la paginación si la búsqueda no cambia"), así que no hay carrera entre el montaje y la
   paginación.
2. **`useSyncExternalStore`**: los cambios de token (`login`, `logout`, `setToken`) deben ir dentro de
   `act(...)` o el test avisa de actualizaciones fuera de `act`.
3. **Adapter de Axios propio**: no aplica `validateStatus`, así que un 400/401 resuelve en vez de rechazar.
   En `src/lib/api.test.ts` el adapter lanza `AxiosError` manualmente.
4. **`api.ts` lee `NEXT_PUBLIC_API_URL` al importarse**: `vitest.config.mts` la fija para que `baseURL` sea
   determinista.
5. **`TaskCard` renderiza `TaskStatusMenu`**, que usa React Query: los tests de `TaskCard`/`TaskList` deben
   usar `renderWithProviders`.
6. **`UserPagination` recibe la página del servidor**: al pulsar "Siguiente" se envía
   `pageData.number + 1`. Los tests reflejan ese comportamiento actual (ver deuda en `technical-debt.md`).
7. **`Sidebar` renderiza dos veces** (escritorio y drawer móvil): los `aria-label` se repiten, así que
   los tests usan `getAllByRole(...)[0]` o `within(drawer)`.
8. **`inert` no lo aplica jsdom**: el drawer cerrado sigue en el DOM y es accesible para las queries;
   hay que pedirlo explícitamente con `getByRole("dialog", { hidden: true })` y afirmar el atributo.
9. **Textos duplicados**: el badge de estado repite el texto de las estadísticas ("En progreso"), por eso
   `DashboardContent` usa `getAllByText(...)[0]` (las tarjetas se renderizan antes que la lista).
10. **Codificación**: los archivos deben guardarse en **UTF-8 sin BOM**; `Set-Content`/`Out-File` de
    PowerShell 5.1 corrompen tildes y añaden BOM.

---

## 8. Qué no cubre esta suite

- **E2E / navegador real** (Playwright/Cypress): requeriría backend y base de datos; pendiente.
- **Rutas completas** (`src/app/**`): se validan con `npm run build`.
- **Estilos finales**: no hay tests de regresión visual; tampoco se afirman clases Tailwind.
- **Contratos reales del backend**: los servicios se prueban contra mocks; la verificación del contrato
  sigue siendo manual (ver [api-contracts.md](./api-contracts.md)).
- **Accesibilidad automatizada** (`vitest-axe`): pendiente; hoy la a11y se cubre de forma indirecta
  (roles, `aria-current`, `aria-expanded`, `inert`, cierre con `Escape`).
- **`QueryProvider`**: solo configura `staleTime`/`retry` de React Query; se excluye de la cobertura
  porque un test del propio cliente de React Query no aporta señal (ver `vitest.config.mts`).
