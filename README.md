# TaskFlow

Aplicación full-stack de gestión de tareas y usuarios. Incluye autenticación JWT, un dashboard con métricas, un módulo de tareas con búsqueda, paginación y control de estados, y un módulo de administración de usuarios con búsqueda y paginación.

## Características

- Autenticación con JWT (login/logout y protección de rutas).
- Dashboard con KPIs (total, pendientes, en progreso, completadas) y las 5 tareas más recientes.
- Gestión de tareas: listado paginado, búsqueda por nombre, filtro por estado, creación y cambio de estado con transiciones válidas.
- Gestión de usuarios (solo `ADMIN`): listado paginado, búsqueda por nombre/email, alta, edición de
  nombre/email, restablecimiento de contraseña y activación/inactivación de cuentas.
- Roles: `USER`, `MODERATOR`, `ADMIN`.
- Manejo de errores con mensajes amigables (400/401/403/404/409/500/network).
- Estados de UI: loading (skeletons), error (con reintento) y empty state.
- UI responsive, accesible y con tema Dark Slate.

## Stack

### Frontend

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Axios
- TanStack React Query v5
- Sonner (toasts)
- lucide-react (iconos)

### Backend

- Kotlin
- Spring Boot 3.5
- Spring Security
- JWT (jjwt)
- JPA / Hibernate
- PostgreSQL

## Arquitectura

```text
Frontend (Next.js)
    │  Components → Hooks → Services → Axios
    ▼
REST API (Spring Boot)
    │  Controller → Service → Repository
    ▼
PostgreSQL
```

En el frontend la comunicación HTTP está centralizada en una única instancia de Axios (`src/lib/api.ts`), con servicios por dominio (`task-service`, `user-service`) y hooks de React Query (`queries` / `mutations`).

## Seguridad

- Login contra `POST /auth/login`, que devuelve un JWT (`sub` = email, claim `role`, expiración de 1 hora).
- El token se guarda en `localStorage` de forma encapsulada (`src/lib/auth/token.ts`).
- Axios añade `Authorization: Bearer <token>` mediante un interceptor.
- `401` → se limpia la sesión y se redirige a `/login`.
- `403` → no se cierra la sesión; se muestra el error de autorización.
- Autorización por rol en backend: `/users/**` requiere `ROLE_ADMIN`. `POST /users` y `POST /auth/login` son públicos.
- Alcance de tareas por rol: en `GET /tasks`, `GET /tasks/summary` y `PATCH /tasks/{id}/status` un
  `ROLE_USER` solo ve y mueve sus propias tareas (el backend ignora cualquier `userId` de la URL);
  `ROLE_MODERATOR` y `ROLE_ADMIN` ven todas.

## Instalación

### Requisitos

- Node.js 20+ y npm.
- JDK 21.
- PostgreSQL corriendo (por defecto el backend usa `localhost:5434`).

### Backend

```bash
cd taskflow-api/taskflow-api
# Windows: gradlew.bat bootRun
./gradlew bootRun
```

### Frontend

```bash
cd taskflow-frontend
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Variables de entorno

No incluyas valores reales (especialmente secretos) en el repositorio.

Backend (`application.yaml`):

- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`

Frontend (`.env.local`, ignorado por git):

- `NEXT_PUBLIC_API_URL` (por ejemplo, `http://localhost:8080`)

## Uso

1. Inicia sesión en `/login` con un usuario válido.
2. El Dashboard muestra las métricas y las 5 tareas recientes.
3. En `/tasks` busca, filtra, pagina, crea y cambia el estado de las tareas. Un `ROLE_USER` solo ve las
   suyas (lo impone el backend); `ADMIN` y `MODERATOR` ven todas.
4. En `/users` (solo `ADMIN`) busca, pagina, edita usuarios, restablece su contraseña e inactiva o
   reactiva cuentas.

## Estructura del proyecto

```text
taskflow-frontend/
  src/
    app/          # rutas (login, (dashboard), tasks, users)
    components/   # layout, auth, dashboard, tasks, users, providers
    context/      # AuthContext
    hooks/        # queries y mutations
    lib/          # api.ts, services, errors, types, query-keys, ...
```

```text
taskflow-api/taskflow-api/
  src/main/kotlin/com/taskflow/api/
    controller/   # endpoints REST
    service/      # lógica de negocio
    repository/   # acceso a datos (Spring Data)
    entity/       # entidades JPA
    dto/          # request/response
    security/     # JWT y Spring Security
    exception/    # manejo global de errores
```

## Testing

- Backend: `./gradlew test` ejecuta `TaskflowApiApplicationTests.contextLoads()` (`@SpringBootTest`, requiere PostgreSQL y las variables de entorno) y los unitarios de servicio con Mockito (p. ej. `TaskServiceTest`).
- Frontend: Vitest + Testing Library (258 tests, 43 archivos) con umbrales de cobertura en `vitest.config.mts`. Comandos: `npm run test`, `npm run test:coverage`, `npm run test:ci`; para validación estática, `npm run lint` y `npx tsc --noEmit`. Detalle en [docs/testing.md](docs/testing.md).

## Estado del proyecto

MVP funcional: autenticación, dashboard, tareas y usuarios conectados al backend real.

## Limitaciones conocidas / Mejoras futuras

- El JWT se almacena en `localStorage`; una mejora futura es migrar a cookie `httpOnly` + protección server-side (proxy/DAL).
- No hay refresh token (el backend no lo soporta).
- El modal no implementa "focus trap" avanzado (solo cierre con Escape/overlay).
- `POST /tasks` está limitado a `ADMIN`/`MODERATOR` en el backend, pero la UI solo ofrece el alta a
  `ADMIN`; un `MODERATOR` recibiría `403` al abrir el modal porque este carga usuarios con `GET /users`
  (ADMIN-only).
- `GET /users` no devuelve `role` (`UserResponse` = id, name, email, active), por lo que la tabla de usuarios no muestra una columna de rol.

