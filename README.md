# ABAD Laboratorio — Registro de Pacientes (Athenea export MVP)

Módulo interno para capturar datos demográficos de pacientes y **exportarlos en el
formato `InsPaciente` de Athenea** (JSON individual, JSON por lote, Excel) para que
el ERP de Athenea los consuma. Reemplaza la digitación manual.

> El envío directo a la API de Athenea (POST `insPaciente`) está **deshabilitado**
> en este MVP porque falta el documento/credenciales de autenticación JWT. El
> payload generado es exactamente el que ese endpoint espera, listo para POSTear
> cuando exista la autenticación. Ver `HANDOFF.md`.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript strict
- Tailwind CSS 4 · shadcn-style UI (Radix)
- React Hook Form · Zod 4
- Prisma 7 (driver adapter `@prisma/adapter-pg`) · PostgreSQL 18
- ExcelJS (export `.xlsx`)
- Vitest (unit) · Playwright (e2e smoke)
- Docker Compose (app + db)

## Requisitos

- Docker + Docker Compose (camino recomendado), **o**
- Node 24+ y pnpm 11 + un PostgreSQL local.

## Arranque rápido con Docker (recomendado)

Desarrollo (hot reload, corre migraciones y seed automáticamente):

```bash
docker compose up --build
# App:  http://localhost:3000
# DB:   localhost:5432
```

Producción (imagen standalone, migra al arrancar). En prod **no hay defaults
inseguros**: `ADMIN_PASSWORD`, `SESSION_SECRET` y `POSTGRES_PASSWORD` son
obligatorios.

```bash
export ADMIN_PASSWORD=algo-seguro
export SESSION_SECRET="$(openssl rand -hex 32)"
export POSTGRES_PASSWORD="$(openssl rand -hex 24)"
export EXPORT_API_KEY=demo-key
# Sembrar catálogos + mapeo + demo en una DB nueva (idempotente, solo upserts):
export RUN_SEED_ON_START=true
docker compose -f docker-compose.prod.yml up --build
docker compose -f docker-compose.prod.yml ps
```

### Sembrar una DB de producción/demo nueva

Una DB recién creada solo tiene el esquema (las migraciones), **no** los catálogos
ni el mapeo D0-D9. Para que el registro/exportación sean usables hay que sembrar.
Dos formas seguras (ambas idempotentes, **nunca** sobrescriben de forma
destructiva):

```bash
# Opción A — automático al arrancar (recomendado para demo):
RUN_SEED_ON_START=true docker compose -f docker-compose.prod.yml up --build

# Opción B — manual, contra un stack ya levantado:
docker compose -f docker-compose.prod.yml exec app node prisma/seed.cjs
```

Login en `/login` con `ADMIN_PASSWORD` (por defecto `abad-admin` en dev).

La app siempre queda en **http://localhost:3000** (dev y prod).

> Nota para demo: el indicador flotante de Next solo aparece con `next dev`
> (`docker compose up --build`). Para una demo visual sin ese indicador y con el
> mismo runner standalone de producción, usá `docker compose -f docker-compose.prod.yml up --build`.

### Solución de problemas — Docker

**pnpm es determinístico**: la versión está pineada con `packageManager` en
`package.json` y `corepack prepare pnpm@11.7.0 --activate` en el Dockerfile.
Corepack nunca resuelve `latest`, así que el build es reproducible.

**Si el build de Docker falla por DNS** (`getaddrinfo EAI_AGAIN
registry.npmjs.org`), usá la red del host para el build y luego levantá normal:

```bash
docker compose -f docker-compose.prod.yml build --network=host app
docker compose -f docker-compose.prod.yml up
# App: http://localhost:3000
```

## Arranque local sin Docker

```bash
cp env.example .env            # editar credenciales
pnpm install
pnpm prisma migrate deploy     # o: pnpm prisma:migrate:dev
pnpm prisma:seed
pnpm dev
```

## Variables de entorno

Ver `env.example`. Claves relevantes:

| Variable                 | Descripción                                                        |
| ------------------------ | ------------------------------------------------------------------ |
| `DATABASE_URL`           | Cadena de conexión Postgres.                                       |
| `ADMIN_PASSWORD`         | Contraseña del panel admin.                                        |
| `SESSION_SECRET`         | Secreto HMAC de la cookie de sesión.                               |
| `EXPORT_API_KEY`         | (Opcional) API key para los endpoints `/api/athenea`.             |
| `ATHENEA_SEX_EXPORT_KEY` | `SEXO` o `IDSEXO` (la doc es inconsistente — ver HANDOFF).        |
| `ATHENEA_DATE_FORMAT`    | Formato de `FECHANACIMIENTO` (tokens `yyyy MM dd`).               |

## Funcionalidad

- **Asistente de registro** (7 pasos) con validación por paso, edad visual,
  `Sin correo`, Habeas Data y resumen editable por sección.
- **Persistencia** de pacientes en Postgres.
- **Admin**: búsqueda/listado/detalle, edición de paciente, edición de catálogos
  (con su `atheneaValue`) y edición del **mapeo D0-D9**.
- **Exportaciones**:
  - JSON individual (`InsPaciente`)
  - JSON por lote
  - Excel `.xlsx`
  - Manifiesto de auditoría por exportación
- **API REST** (consumo por máquina, formato Athenea exacto):
  - `GET /api/athenea/patients` → lote de `InsPaciente`
  - `GET /api/athenea/patients/:id` → un `InsPaciente`
  - Auth: cookie de sesión **o** header `x-api-key: <EXPORT_API_KEY>`.
- **Health**: `GET /api/health` (usado por el healthcheck de Docker).

## Convención de nombres de archivo

```
abad-athenea-{individual|batch}-{yyyyMMdd-HHmmss}.json
abad-athenea-excel-{yyyyMMdd-HHmmss}.xlsx
abad-athenea-manifest-{yyyyMMdd-HHmmss}.json
```

## Scripts

```bash
pnpm dev            # desarrollo
pnpm build          # build de producción (standalone)
pnpm lint           # ESLint
pnpm typecheck      # tsc --noEmit
pnpm test           # Vitest (unit)
pnpm test:e2e       # Playwright (requiere app+db corriendo)
pnpm prisma:seed    # sembrar catálogos + mapeo + pacientes demo
```

## Estructura

```
app/                 rutas (home, login, patients, admin, exports, api)
components/ui        primitivas UI (shadcn-style)
features/
  patients/          schema Zod, actions, wizard, lista, detalle
  catalogs/          catálogos + editor de mapeo D0-D9
  exports/           builder Athenea, excel, manifest, filename, API service
lib/
  db/                cliente Prisma (driver adapter)
  auth/              sesión admin + acceso API
  config/            env tipado
prisma/              schema, migraciones, seed
tests/               unit (vitest) + e2e (playwright)
```

Ver `HANDOFF.md` para gaps conocidos y guía de auditoría.
