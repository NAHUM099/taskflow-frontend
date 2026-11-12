@AGENTS.md

# TaskFlow Frontend — guía maestra para agentes de IA

> **Punto de entrada obligatorio.** Documenta la arquitectura, las convenciones y las reglas de trabajo del
> repositorio `taskflow-frontend`. El detalle vive en `docs/` (ver tabla siguiente); aquí solo está lo que
> todo agente necesita saber antes de tocar código.
>
> Auditoría del código: **2026-10-11**. Si el código y este documento entran en conflicto, **manda el
> código**: corregir la documentación en el mismo cambio.
> Lo que no haya podido verificarse se marca como **(PENDIENTE DE CONFIRMAR)**; no rellenar huecos con
> suposiciones.

---

## 0. Documentos del repositorio y cuándo consultarlos

| Documento | Contenido | Consultarlo cuando… |
| --- | --- | --- |
| **`CLAUDE.md`** (este) | Contexto, stack, reglas obligatorias, comandos, flujo de trabajo | Siempre, al empezar cualquier tarea |
| [`docs/architecture.md`](docs/architecture.md) | Estructura de carpetas, rutas, capas, providers, estado, auth, formularios, errores, server/client, accesibilidad | Se añade/mueve un archivo, hook, servicio o ruta; se toca sesión, formularios o manejo de errores |
| [`docs/design-system.md`](docs/design-system.md) | Tokens, paleta, tipografía, espaciados, radios, sombras, inventario de componentes con sus clases, shell, breakpoints, estados, animaciones, z-index | Se modifica cualquier estilo, layout o componente visual, o se crea uno nuevo |
| [`docs/api-contracts.md`](docs/api-contracts.md) | Endpoints usados y no usados, roles del backend, formas de datos, reglas al tocar datos | Se consume un dato nuevo, cambia un payload o aparece un `401`/`403` inesperado |
| [`docs/technical-debt.md`](docs/technical-debt.md) | Deuda técnica, limitaciones, carencias de accesibilidad, riesgos y pendientes de confirmar | Se planifica una mejora o se toca un área con deuda (para no empeorarla) |
| [`docs/testing.md`](docs/testing.md) | Stack de pruebas, comandos, convención de archivos, mocking, umbrales y trampas | Se escribe/ajusta un test o se toca la configuración de Vitest |
| `README.md` | Puesta en marcha, variables de entorno, descripción funcional | Se prepara el entorno local o se actualiza la documentación funcional |
| `AGENTS.md` | Reglas de Next.js **administradas por `next dev`** (bloque `BEGIN/END:nextjs-agent-rules`) | Nunca editar a mano; se regenera solo |

---

## 1. Contexto y objetivo

**TaskFlow** es una aplicación web de gestión de tareas y usuarios (SaaS de demostración / pieza de
portafolio). Este repositorio contiene **solo el frontend**; consume una API REST en Kotlin + Spring Boot
que vive en otro repositorio.

- Autenticación con email/contraseña (JWT) y persistencia de sesión en el navegador.
- Dashboard con KPIs por estado (Total, Pendientes, En progreso, Completadas) y las 5 primeras tareas del
  listado (`tasks.slice(0, 5)`).
- Tareas: listado, filtro por estado, creación y cambio de estado respetando transiciones válidas.
- Usuarios (solo `ROLE_ADMIN`): listado paginado, búsqueda por nombre/email, alta y edición de
  nombre/email.
- Roles: `ROLE_USER`, `ROLE_MODERATOR`, `ROLE_ADMIN`.

| Repositorio | Ruta local | Remoto | Permiso |
| --- | --- | --- | --- |
| Frontend | `C:\SPRING-KOTLIN\taskflow-frontend` | `github.com/NAHUM099/taskflow-frontend` | **Aquí sí se trabaja** |
| Backend | `C:\SPRING-KOTLIN\taskflow-api\taskflow-api` | `github.com/NAHUM099/taskflow-api` | **Solo lectura**: se puede leer para respetar contratos, **nunca** modificar |

Estado actual: MVP funcional conectado al backend real, tema oscuro único (sin toggle claro/oscuro) y
**suite de pruebas automatizadas** con Vitest + Testing Library (205 tests, 36 archivos; detalle en
[`docs/testing.md`](docs/testing.md)).

---

## 2. Stack real (versiones instaladas en `node_modules`)

| Área | Tecnología | Versión |
| --- | --- | --- |
| Framework | Next.js (App Router, Typed Routes) | 16.4.2 |
| UI | React / React DOM | 19.2.8 |
| Lenguaje | TypeScript (`strict: true`) | 5.9.3 |
| Estilos | Tailwind CSS (CSS-first, sin `tailwind.config.*`) | 4.3.3 |
| Datos remotos | TanStack React Query | 5.102.8 |
| HTTP | Axios | 1.20.0 |
| Toasts | Sonner | 2.0.8 |
| Iconos | lucide-react | 1.37.0 |
| Lint | ESLint (flat config) + `eslint-config-next` | 9.39.5 / 16.4.2 |
| Tests | Vitest + Testing Library (jsdom) | 5.1.0 / 16.3.3 |
| Compilador | React Compiler (`reactCompiler: true`) | `babel-plugin-react-compiler` 1.0.0 |
| CI | Jenkins (`NodeJS22`): `npm ci` → `lint` → `test:ci` → `build` | — |

**No hay** librería de UI (shadcn/MUI/Radix), ni gestor de estado global (Redux/Zustand), ni librería de
formularios (React Hook Form/Zod), ni Prettier, ni Husky, ni `components/ui/`. Introducir cualquiera de
ellas requiere justificación y aprobación explícita.

---

## 3. Estructura general

```text
src/
├─ app/                    # App Router: layout.tsx, globals.css, login/, (dashboard)/
├─ components/             # por dominio: auth/ dashboard/ layout/ providers/ tasks/ users/
├─ context/AuthContext.tsx # sesión (provider + useAuth)
├─ hooks/                  # queries/ y mutations/ (React Query)
└─ lib/                    # api.ts, errors.ts, navigation.ts, query-keys.ts, task-status.ts,
                           # types.ts, auth/, services/
```

- Rutas: `/login`, `/` (dashboard), `/tasks`, `/users`.
- Agrupación **por dominio funcional**, no por tipo de archivo. No reorganizar a `features/*`.
- Árbol completo, rutas con sus guards y archivos de configuración:
  [`docs/architecture.md`](docs/architecture.md).

---

## 4. Arquitectura y flujo de datos

```text
page.tsx (Server Component mínimo)
  → *Content (Client)  →  hook React Query  →  service (Axios)  →  lib/api.ts  →  API REST
```

Cinco reglas de oro (el resto está en [`docs/architecture.md`](docs/architecture.md)):

1. **Ningún componente llama a `api` ni conoce URLs**: siempre `componente → hook → service`. Las URLs
   viven únicamente en `src/lib/services/*-service.ts`.
2. Toda query usa una key de `src/lib/query-keys.ts` y toda mutation invalida su dominio
   (`invalidateQueries({ queryKey: taskKeys.all })`). No hay actualizaciones optimistas.
3. El `*Content` es el dueño de los datos y del estado de UI; los hijos reciben props tipadas.
4. Los datos del servidor **nunca** se piden con `useEffect` + `fetch`; `useEffect` es solo para efectos de
   UI, teclado, scroll y suscripciones.
5. Errores: `getApiErrorMessage(error, fallback)` para el mensaje y `toast.success/error` (Sonner) para el
   feedback; las listas muestran estado de error con botón "Reintentar".

Sesión: JWT en `localStorage` (clave `taskflow.token`, encapsulada en `src/lib/auth/token.ts`),
`AuthContext` con `useSyncExternalStore`, guards de cliente `RequireAuth` / `RequireAdmin`. **La
autorización real está en el backend**: ocultar UI no protege un endpoint.

---

## 5. Convenciones de desarrollo

| Elemento | Convención | Ejemplos reales |
| --- | --- | --- |
| Componente React | archivo y componente `PascalCase`, uno por archivo, `export function` nombrado | `TaskCard`, `UserPagination` |
| Página / layout | `page.tsx` / `layout.tsx` con `export default` | `src/app/(dashboard)/tasks/page.tsx` |
| Orquestador de página | sufijo `*Content` (cliente: datos + estado) | `TasksContent`, `UsersContent` |
| Cabecera de módulo | sufijo `*Header` | `TasksHeader`, `UsersHeader` |
| Guard de acceso | prefijo `Require*` | `RequireAuth`, `RequireAdmin` |
| Hook | `use*` en `hooks/queries` o `hooks/mutations` | `useTasks`, `useCreateTask` |
| Servicio | `*-service.ts` con funciones nombradas exportadas | `task-service.ts` → `getTasks` |
| Utilidades | archivo `kebab-case.ts` en `lib/` | `query-keys.ts`, `task-status.ts` |
| Tipos | `PascalCase` con sufijos `*Response`, `*Request`, `*Params`, `*Filters` | `TaskResponse` |
| Props | `interface XxxProps` | `TaskCardProps`, `EditUserModalProps` |
| Constantes | `UPPER_SNAKE_CASE` | `TASK_STATUS_META`, `navItems` |
| Código (identificadores) | **inglés** | `isPending`, `onClose` |
| UI y comentarios | **español**, tono directo | "El título es obligatorio." |

- **Imports:** alias `@/*` para todo lo que cruza carpetas (`@/lib/api`, `@/components/tasks/TaskCard`);
  relativos (`./Header`) solo en la misma carpeta; tipos con `import type` (obligatorio con
  `isolatedModules`); orden habitual: externos → alias del proyecto → relativos; iconos por import
  nombrado desde `lucide-react` (nunca SVG inline).
- **Client/Server:** `"use client"` solo en el punto de entrada cliente de cada rama (14 archivos hoy; la
  lista está en [`docs/architecture.md`](docs/architecture.md)). Las `page.tsx`/`layout.tsx` no lo llevan.
- **Formularios:** controlados con `useState` + `validate()` local que devuelve errores por campo; mensajes
  en español. La validación es UX: si el backend responde `400`, manda su `message`.
- **Comentarios:** breves, en español, solo para un *por qué* no evidente (p. ej.
  `// Espejo de TaskStatus.allowedTransitions del backend.`); nada de código comentado ni `TODO` sin
  contexto.
- **Fuentes únicas de verdad** (no duplicar): estados y transiciones → `src/lib/task-status.ts`;
  navegación y roles visibles → `src/lib/navigation.ts`; claves de caché → `src/lib/query-keys.ts`;
  tipos → `src/lib/types.ts`.

---

## 6. Reglas para modificar el frontend

Obligatorias para cualquier agente o desarrollador:

1. **Leer antes de tocar.** Revisar el componente completo, sus props, quién lo usa (`grep` del nombre) y
   de qué hooks/servicios depende.
2. **Cambios quirúrgicos.** No reescribir un componente entero para un ajuste puntual; preservar
   estructura, nombres, textos y comportamiento no relacionado.
3. **No duplicar.** Antes de crear un componente o helper, comprobar si ya existe algo equivalente. A la
   tercera repetición de una lógica, extraerla a un único lugar.
4. **Reutilizar estilos y patrones.** Usar las clases canónicas de
   [`docs/design-system.md`](docs/design-system.md); no inventar variantes visuales sin pedido explícito.
5. **Coherencia visual global.** Un cambio debe verse igual en todos los módulos (mismas alturas, radios,
   sombras, textos de estado, colores de badges).
6. **Alcance acotado.** No modificar funcionalidades ni archivos no relacionados; no refactorizar de paso
   sin avisar.
7. **Responsive intacto.** Verificar móvil (`< sm`), tablet (`sm`/`lg`) y escritorio (`lg+`), incluidos
   sidebar colapsado y drawer.
8. **Sin dependencias nuevas sin justificación.** Explicar qué problema resuelve y por qué no vale lo ya
   instalado; requiere aprobación del responsable.
9. **Sin datos ficticios.** Nada de mocks, arrays hardcodeados ni `setTimeout` simulando la API en
   funcionalidades conectadas al backend.
10. **No borrar código funcional.** Si algo parece muerto, verificar su uso; eliminarlo requiere
    justificación explícita en el informe.
11. **Compatibilidad.** Mantener contratos existentes: props públicas, firmas de hooks/servicios, keys de
    React Query, tipos de `src/lib/types.ts` y estructura de rutas.
12. **Verificar antes de terminar.** `npm run lint`, `npm run build` y prueba manual del flujo afectado
    (§9). Un cambio no está terminado hasta que compila y funciona.

Reglas específicas del repositorio:

- **Solo frontend.** El backend es otro repositorio y es **solo lectura**: si falta un endpoint o
  restringe algo, se **documenta** y se resuelve en el frontend (o se avisa), nunca tocando el backend.
- **Estados de tarea:** etiquetas, colores y transiciones viven en `src/lib/task-status.ts`; no repetir
  strings como `"PENDING"` ni colores de estado en componentes.
- **Roles:** usar los helpers de `src/lib/auth/types.ts` y comparar contra `"ROLE_ADMIN"`, nunca contra el
  texto traducido.
- **Control de versiones:** el agente **no** crea commits, push ni PRs salvo instrucción explícita;
  entrega los cambios en el árbol de trabajo.
- **Cambios de arquitectura** (mover/renombrar carpetas, cambiar stack o sistema de estilos): aprobación
  previa y actualización de este documento.

---

## 7. Diseño y consistencia visual (resumen operativo)

- **Tema oscuro único** ("Dark Slate"): fondo `#0f172a`, superficies `slate-800`/`slate-900`, acento
  **indigo**, bordes `slate-700/60`, radios generosos (8/12/16 px), iconografía `lucide-react`.
- Utility-first puro: todo el estilo son clases Tailwind en el JSX; el único CSS global es
  `src/app/globals.css` (solo 2 tokens de color y 2 de tipografía).
- **Valores canónicos ya definidos** — alturas (`h-16` header, `h-11` inputs, `h-10` botones, `size-8`
  iconos), paddings, sombras, estados, animaciones y z-index (`30` header, `40` sidebar/overlay, `50`
  drawer/menús, `60` modales): ver [`docs/design-system.md`](docs/design-system.md).
- **Breakpoints:** solo `sm`, `lg` y `xl`; mobile-first. No introducir `md`/`2xl` de forma aislada.
- **Colores de estado de tarea:** única fuente `TASK_STATUS_META`; no duplicarlos.
- Si hace falta un valor nuevo: definirlo como **token** en `src/app/globals.css` (`@theme inline`) o
  reutilizar una utilidad existente; nunca un hex suelto ni una clase ad-hoc para un solo componente.

---

## 8. Seguridad y protección

- **No** modificar `.env`, `.env.local` ni ningún archivo de entorno; **no** añadir secretos al repositorio.
  Todo lo que empieza por `NEXT_PUBLIC_` es **público**.
- **No** exponer credenciales, tokens, JWT completos ni datos personales en logs, toasts, comentarios o
  mensajes de error. Nunca `console.log` del token ni de la respuesta de `/auth/login`.
- **No** cambiar configuraciones críticas (`next.config.ts`, `tsconfig.json`, `eslint.config.mjs`,
  `Jenkinsfile`, CI/CD, dominio/CORS del backend) sin autorización explícita.
- **No** cambiar contratos de API: si el backend responde distinto a lo documentado en
  [`docs/api-contracts.md`](docs/api-contracts.md), documentarlo y adaptar el frontend de forma defensiva;
  no inventar campos.
- **No** eliminar funcionalidades ni hacer operaciones destructivas (borrado de datos, `rm -rf`, resets de
  git, force-push) sin autorización explícita.
- **No** debilitar la seguridad del cliente: nada de `dangerouslySetInnerHTML`, `eval`, desactivar guards,
  ni guardar datos sensibles fuera de la clave existente de `localStorage`.
- La autorización real está en el backend: ocultar UI **no** es control de acceso.

---

## 9. Comandos y validaciones

> Todos los comandos se ejecutan **dentro de `taskflow-frontend/`** salvo los del backend (referencia).

| Acción | Comando | Notas |
| --- | --- | --- |
| Requisito | Node.js **22.12+** y npm | Vitest 5 lo exige; el CI usa Node 22 (`NodeJS22` en `Jenkinsfile`) |
| Instalar dependencias | `npm install` | `npm ci` en CI (requiere `package-lock.json` versionado) |
| Entorno de desarrollo | `npm run dev` | Next en `http://localhost:3000` |
| Build de producción | `npm run build` | Incluye **type checking**, pero en Next 16 ya **no** ejecuta ESLint: el lint es un paso aparte |
| Servir el build | `npm run start` | Requiere haber ejecutado `build` |
| Linter | `npm run lint` | Equivale a `eslint` con `eslint.config.mjs` |
| Type checking aislado | `npx tsc --noEmit` | Atajo útil; `build` ya lo hace |
| Tests | `npm run test` | Una pasada; `npm run test:watch` para desarrollo |
| Cobertura | `npm run test:coverage` | Aplica umbrales (global 95 %, `src/lib/**` 95 %, `src/hooks/**` 100 %) |
| Tests + JUnit (CI) | `npm run test:ci` | Escribe `coverage/junit.xml`; es el que usa Jenkins |
| Un archivo / un test | `npx vitest run <ruta>` / `npx vitest run -t "<nombre>"` | Filtros de Vitest |
| Backend (referencia) | `.\gradlew.bat bootRun` en `C:\SPRING-KOTLIN\taskflow-api\taskflow-api` | Requiere PostgreSQL (por defecto `localhost:5434`) y `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET` |
| Tests del backend (referencia) | `.\gradlew.bat test` | `@SpringBootTest`: necesita PostgreSQL y las variables de entorno del backend |

**Entorno:** el frontend necesita `NEXT_PUBLIC_API_URL` en `.env.local` (p. ej. `http://localhost:8080`).
Ese archivo está ignorado por git y **no debe crearse ni modificarse** sin autorización.

**Comprobaciones mínimas antes de dar una tarea por terminada:**

1. `npm run lint` sin errores nuevos.
2. `npm run test` en verde (si se tocó lógica, hooks o componentes, añadir/ajustar el `.test` colocado).
3. `npm run build` correcto (falla si hay errores de tipos).
4. Prueba manual del flujo afectado con el backend levantado (login → dashboard → tareas → usuarios).

---

## 10. Flujo de trabajo obligatorio para agentes

1. **Entender la solicitud.** Si algo es ambiguo (alcance, comportamiento esperado, diseño), preguntar
   antes de escribir código. No asumir requisitos.
2. **Consultar la documentación relevante** con la tabla del §0 y **leer los archivos involucrados**:
   componente, hijos, props, hooks y servicios. Revisar `src/lib/types.ts` y el contrato real del backend
   cuando el cambio toque datos.
3. **Identificar dependencias y efectos secundarios.** Buscar todos los usos (`grep`) del componente,
   tipo, key de query o helper a modificar; comprobar si afecta a otra ruta.
4. **Proponer un plan breve.** 3–6 pasos con los archivos a tocar. Si el cambio es grande o altera
   arquitectura/estilos globales, esperar aprobación.
5. **Implementar solo lo necesario**, respetando §5, §6 y §7.
6. **Revisar regresiones.** Estados de carga, error y vacío; responsive; roles; y que no se haya duplicado
   lógica existente.
7. **Ejecutar validaciones** (§9). Si algo falla, corregirlo antes de informar.
8. **Informar:** archivos modificados y qué cambió en cada uno; decisiones y su justificación; validaciones
   ejecutadas y su resultado; riesgos, pendientes o cosas fuera de alcance.

**Definición de terminado:** compila sin errores, pasa el lint, pasa la suite de tests, el comportamiento
previo sigue intacto, es coherente visualmente, es responsive y el informe está entregado. Sin commits ni
PRs salvo petición explícita.

---

## 11. Límites conocidos (resumen) e índice de deuda

Estado **actual**, no una lista de tareas a ejecutar sin aprobación. Detalle completo, numerado y
priorizable en [`docs/technical-debt.md`](docs/technical-debt.md).

- **No existe `components/ui/`**: primitivos repetidos en `Dashboard*`, `Tasks*` y `Users*` (riesgo de
  divergencia visual). Cualquier primitivo nuevo debe justificarse y, si es posible, reutilizarse.
- **Tests sin E2E ni a11y automatizada**: 205 tests / 36 archivos y 98 % de líneas (incluye `components/layout`,
  `components/dashboard` y el flujo `401`/logout); faltan Playwright y `vitest-axe`. El CI ya ejecuta `lint` y
  `test:ci` además del build.
- **Sin `error.tsx`, `not-found.tsx` ni `loading.tsx`**.
- **Validación de formularios triplicada** y sin esquema compartido.
- **Sin guard de entorno** para `NEXT_PUBLIC_API_URL`.
- **`decodeToken` no valida `exp`**: un JWT caducado se trata como sesión válida hasta el primer `401`.
  JWT en `localStorage`, sin refresh token; protección de rutas solo en cliente.
- **Modales sin focus trap** ni `aria-invalid`/`aria-describedby`; sin `prefers-reduced-motion`.
- **`UserResponse` sin `active`** en `src/lib/types.ts` (el backend lo envía) y `createdAt` sin usar.
- **Endpoints del backend sin consumir** y **permisos inconsistentes** (MODERATOR/`/users/**`): ver
  [`docs/api-contracts.md`](docs/api-contracts.md).

---

## 12. Mantenimiento de esta documentación

- **Actualizar `CLAUDE.md`** ante cambios de arquitectura, stack, dependencias, estructura de carpetas,
  contratos de API, sistema de diseño o convenciones de trabajo (regla breve → resumen aquí; detalle → el
  documento de `docs/` correspondiente).
- **Actualizar el documento de `docs/`** que corresponda en el mismo cambio que provoca la modificación:
  estilos/layout → `design-system.md`; estructura/hooks/servicios/rutas → `architecture.md`;
  endpoints/datos/roles → `api-contracts.md`; deuda resuelta o detectada → `technical-debt.md`.
- **No actualizar** por ajustes visuales menores, correcciones de texto o refactors internos sin impacto en
  las convenciones.
- **Evitar duplicación:** cada dato vive en un solo documento; en `CLAUDE.md` solo el resumen operativo y
  el enlace. Si una regla aparece en dos sitios y difieren, prevalece `CLAUDE.md` y se corrige el otro.
- Mantener `README.md` coherente con este documento y con `docs/` (misma terminología y comandos).
