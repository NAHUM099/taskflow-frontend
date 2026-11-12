# Deuda técnica y limitaciones conocidas — TaskFlow Frontend

> Estado **actual** verificado el **2026-10-11**. Este documento sirve para **no empeorar** y para
> priorizar; **no** es una lista de cambios a ejecutar sin aprobación.
> Punto de entrada: [../CLAUDE.md](../CLAUDE.md). Diseño: [design-system.md](./design-system.md).
> Contratos: [api-contracts.md](./api-contracts.md).

---

## Arquitectura y calidad

1. **No existe `components/ui/`.** Botones, inputs, labels, badges, skeletons, bloques de error/vacío y
   cabeceras de "tabla" están repetidos en `Dashboard*`, `Tasks*` y `Users*`. Riesgo real: divergencia
   visual al tocar un solo sitio.
2. **Sin pruebas E2E ni a11y automatizada**: la suite unitaria/integración (189 tests, 34 archivos) cubre
   `lib` (100 %), hooks (100 %), `AuthContext`, `components/*` y el flujo `401`/logout de punta a punta con
   jsdom, con 98 % de líneas globales (ver [testing.md](./testing.md)). Falta Playwright, `vitest-axe` y
   cualquier verificación contra el backend real. El CI ya ejecuta `npm run lint` y `npm run test:ci` antes
   del build.
3. **Sin `error.tsx`, `not-found.tsx` ni `loading.tsx`**: un error de render cae en la pantalla por
   defecto de Next y un 404 no tiene diseño propio.
4. **Validación de formularios triplicada** (`LoginForm`, `CreateTaskModal`, `EditUserModal`) sin esquema
   compartido; los mensajes se repiten.
5. **Sin guard de entorno**: si `NEXT_PUBLIC_API_URL` no está definida, Axios usa rutas relativas y los
   fallos se vuelven confusos.
6. **Hooks de datos fuera del `*Content`**: `RecentTasks` y `TaskStatusMenu` consultan/mutan por su
   cuenta, lo que rompe parcialmente el patrón de composición.
7. **Lógica de dropdown duplicada** (`TaskStatusMenu` y el `UserMenu` interno de `Sidebar.tsx`) sin
   navegación por teclado (flechas, Home/End).
8. **Assets heredados de `create-next-app`** en `public/` (`next.svg`, `vercel.svg`, `file.svg`,
   `globe.svg`, `window.svg`) sin uso.

---

## Seguridad y sesión

9. **`decodeToken` no valida `exp`**: un JWT expirado se considera sesión válida hasta que una petición
   devuelve `401` (no hay aviso proactivo ni redirección anticipada).
10. **JWT en `localStorage`** (vulnerable a XSS) y **sin refresh token**. Migrar a cookie `httpOnly` +
    proxy server-side es una mejora pendiente documentada también en `README.md`.
11. **Protección de rutas solo en cliente**: no hay `middleware`; el contenido privado se protege con JS y
    se ve un spinner durante la hidratación.

---

## UI/UX y accesibilidad

12. **Modales sin focus trap**, sin foco inicial y sin restaurar el foco al cerrar; formularios sin
    `aria-invalid`/`aria-describedby`.
13. **Sin `prefers-reduced-motion`** pese a animaciones de modal/drawer.
14. **Inconsistencias menores**: selects de `TaskFilters` a `h-10` frente a `h-11` en formularios, y la
    etiqueta flotante del sidebar colapsado usa `rounded-md` (el resto de elementos pequeños usan
    `rounded-lg`).
15. **Botón "Mi perfil" en el `Sidebar` sin destino** (no existe página de perfil ni endpoint accesible).
    Es la única línea sin cubrir de `Sidebar.tsx` (L300): decidir si se elimina o se deshabilita **antes** de
    escribirle un test, para no congelar un no-op.
16. **`DashboardStats` define sus etiquetas de estado a mano** en vez de derivarlas de `TASK_STATUS_META`.

---

## Datos y contratos

17. **`UserResponse` del frontend no declara `active`** (el backend sí lo envía) ni `role` (el backend no
    lo devuelve en el listado); por eso la tabla de usuarios no muestra estado ni rol.
18. **Endpoints sin usar**: `GET /users/{id}`, `PATCH /users/{id}/status`, `DELETE /users/{id}`,
    `GET /users/{id}/tasks`, `PATCH /users/me/password`, `POST /users`.
19. **`createdAt` nunca se muestra** y no existe helper de formato de fechas.
20. **`id: number | null`** en `TaskResponse`/`UserResponse` obliga a comprobaciones de nulidad en cada
    uso.
21. **Inconsistencias de permisos backend/frontend**: `MODERATOR` puede crear tareas por API pero la UI
    restringe el alta a `ADMIN`, y ese rol recibiría `403` al cargar usuarios dentro del modal;
    `PATCH /users/me/password` es ADMIN-only. Detalle en [api-contracts.md](./api-contracts.md).
22. **Paginación de usuarios con doble fuente de verdad**: `UsersContent` guarda `page` en estado local pero
    `UserPagination` recibe `pageData.number` del servidor. Hoy coinciden; si el backend recortara la página
    pedida (p. ej. al borrar el último usuario de la última página) la UI quedaría desincronizada. Los tests
    documentan el comportamiento actual (`UsersContent.test.tsx`).

---

## Pendiente de confirmar

- Cobertura real de los tests del backend y política definitiva de creación de tareas (el `README` indica
  que `POST /tasks` limita por rol admin/mod en backend, mientras la UI restringe a ADMIN).
- Estrategia de despliegue del frontend más allá del CI de Jenkins (`vercel.app` aparece en CORS, pero no
  hay configuración de despliegue versionada en este repositorio).

---

## Cómo usar este documento

- Al tocar un área con deuda técnica: **no empeorarla** y no "arreglarla de paso" sin avisar.
- Si una tarea pide resolver un punto de esta lista, hacerlo en un cambio propio, con sus validaciones y
  actualizando este documento (mover el punto a "resuelto" o eliminarlo).
- Un punto resuelto deja de ser deuda: si ya no aplica, borrarlo en el mismo cambio que lo resuelve.
