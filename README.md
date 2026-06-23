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

## Arranque rápido con Docker

**El comando por defecto levanta PRODUCCIÓN** (imagen standalone, sin el
indicador "N" de Next). Es lo que ve un cliente.

```bash
cp env.example .env            # editar secrets reales (ver más abajo)
docker compose up -d --build
# App: http://localhost:3000
```

El stack productivo (`docker-compose.yml`) corre `node server.js` con
`NODE_ENV=production`, aplica migraciones y **siembra el super admin inicial**
antes de arrancar. En prod **no hay defaults inseguros**: `POSTGRES_PASSWORD`,
`SESSION_SECRET`, `SUPERADMIN_EMAIL` y `SUPERADMIN_PASSWORD` son obligatorios
(el compose falla ruidosamente si faltan). Definílos en `.env`.

### Desarrollo (hot reload) — explícito

El modo dev (con el indicador "N", `next dev`) vive en un archivo aparte:

```bash
docker compose -f docker-compose.dev.yml up -d --build   # o: pnpm docker:dev
# App: http://localhost:3000  ·  DB: localhost:5432
```

### Acceso inicial

En una instalación limpia, el seed crea un **SUPER_ADMIN por defecto** para poder
entrar enseguida:

```
Correo:      admin@ilasesorias.com
Contraseña:  Infoseg.00*2026*   (cambiala desde /admin/users tras entrar)
```

La contraseña se guarda **hasheada** (nunca en texto plano) y no se muestra en la
UI. Comportamiento del seed:

- **DB vacía / owner inexistente** → lo crea con el default (o con
  `SUPERADMIN_EMAIL`/`SUPERADMIN_PASSWORD` si los definís en `.env`, solo para esa
  creación inicial).
- **Owner ya existe** → el seed **no lo toca**: si cambiás la contraseña desde
  `/admin/users`, sobrevive a `docker compose restart`/`up`.
- Solo `docker compose down -v` (borra el volumen) regenera el default.

Desde **`/admin/users`** (solo SUPER_ADMIN) podés crear más administradores y
resetear contraseñas. Ver [Roles y acceso](#roles-y-acceso).

### Sembrar catálogos / datos demo

Una DB nueva trae solo el esquema. Para que registro/exportación sean usables hay
que sembrar catálogos + mapeo D0-D9 (idempotente, solo upserts). `.env.example`
trae `RUN_SEED_ON_START=true` para que la primera demo quede sembrada sola.

```bash
# Manual contra un stack ya levantado:
docker compose exec app node prisma/seed.cjs
```

### Backup de datos

`scripts/backup-data.sh` genera un dump de PostgreSQL (formato custom + SQL
plano) más metadata de Docker/Git, sin detener contenedores. Los secretos se
redactan en la metadata.

```bash
./scripts/backup-data.sh          # -> backups/data/swformulario-data-backup-*.tar.gz
```

### Vaciar datos operativos

`scripts/reset-operational-data.sh` vacía pacientes + historial de exportaciones
preservando usuarios admin y catálogos. **Hace backup previo por defecto**, pide
confirmación fuerte y **nunca toca las migraciones**.

```bash
# Prueba sin borrar nada (transacción + ROLLBACK):
./scripts/reset-operational-data.sh --dry-run

# Borra pacientes + historial (mantiene usuarios y catálogos). Backup automático:
./scripts/reset-operational-data.sh

# Variantes:
./scripts/reset-operational-data.sh --with-catalogs   # también vacía catálogos/mapeo
./scripts/reset-operational-data.sh --with-users      # también vacía usuarios admin
./scripts/reset-operational-data.sh --yes             # no interactivo (CI)
```

### Deploy en VPS

`deploy.sh` corre el flujo completo en el servidor: backup (código + DB) → pull →
build → `db` healthy → `app` healthy (migra solo) → verificación.

```bash
./deploy.sh           # deploy normal
./deploy.sh --seed    # además re-siembra catálogos (idempotente)
```

### ⚠️ El indicador "N" es solo de desarrollo

El logo flotante **"N" abajo a la izquierda es el dev indicator de Next.js**.
Solo lo inyecta `next dev` (el stack `docker-compose.dev.yml`). El runner de
producción (`node server.js`) **no lo genera** — no es algo que se configure ni
se "oculte". Por eso para cliente/demo se usa **siempre** el compose por defecto
(`docker compose up -d --build`), nunca el dev.

### Solución de problemas — Docker

**pnpm es determinístico**: la versión está pineada con `packageManager` y
`corepack prepare pnpm@11.7.0`. Corepack nunca resuelve `latest`, build
reproducible.

**Si el build falla por DNS** (`getaddrinfo EAI_AGAIN registry.npmjs.org`), el
compose ya usa `network: host` para el build. Si persiste:

```bash
docker compose build --network=host app
docker compose up -d
```

**Cambiar el password de la DB en un volumen existente**: Postgres solo aplica
`POSTGRES_PASSWORD` en la PRIMERA init del volumen. Si ya existía con otra clave,
recreá el volumen: `docker compose down -v && docker compose up -d --build`.

## Arranque local sin Docker

```bash
cp env.example .env            # editar credenciales
pnpm install
pnpm prisma migrate deploy     # o: pnpm prisma:migrate:dev
pnpm prisma:seed

# Desarrollo (con indicador "N" de Next — está bien para trabajar):
pnpm dev

# Producción local (sin indicador dev — así lo ve el cliente):
pnpm build && pnpm start       # o: pnpm start:prod
```

## Variables de entorno

Ver `env.example`. Claves relevantes:

| Variable                 | Descripción                                                        |
| ------------------------ | ------------------------------------------------------------------ |
| `POSTGRES_USER/PASSWORD/DB` | Credenciales del servicio Postgres (Docker).                    |
| `DATABASE_URL`           | Cadena de conexión Postgres (uso fuera de Docker).                 |
| `SESSION_SECRET`         | Secreto HMAC de la cookie de sesión. **Obligatorio en prod.**      |
| `SUPERADMIN_EMAIL`       | Correo del super admin inicial (seed idempotente).                 |
| `SUPERADMIN_PASSWORD`    | Contraseña inicial del super admin. **Se guarda hasheada.**        |
| `RUN_SEED_ON_START`      | `true` → siembra catálogos/mapeo/demo al arrancar.                 |
| `EXPORT_API_KEY`         | (Opcional) API key para los endpoints `/api/athenea`.             |
| `ATHENEA_SEX_EXPORT_KEY` | `SEXO` o `IDSEXO` (la doc es inconsistente — ver HANDOFF).        |
| `ATHENEA_DATE_FORMAT`    | Formato de `FECHANACIMIENTO` (tokens `yyyy MM dd`).               |

## Roles y acceso

Auth por **email + contraseña** contra la tabla `AdminUser`, con dos roles
(enforcement **server-side**, no por ocultar UI):

| Capacidad | ADMIN | SUPER_ADMIN |
| --- | :---: | :---: |
| Entrar al sistema | ✅ | ✅ |
| Gestionar pacientes | ✅ | ✅ |
| Catálogos + mapeo D0-D9 | ✅ | ✅ |
| Exportaciones | ✅ | ✅ |
| Gestionar admins (`/admin/users`) | ❌ | ✅ |

- El super admin no puede desactivarse ni degradarse a sí mismo, ni dejar el
  sistema sin ningún SUPER_ADMIN activo (validado en las server actions).
- Toda página/acción de `/admin/users` valida `requireSuperAdmin()` en el
  servidor; un ADMIN que entra por URL directa es redirigido a `/`.
- `/patients/new` es **pública** (sin login). Todo lo demás exige sesión.
- Contraseñas: hash scrypt (`lib/auth/password.ts`), nunca en texto plano.

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

## Seguridad — rutas públicas vs protegidas

La autenticación es **a nivel de página** (`requireAdmin()` por página); no hay
`middleware.ts`.

| Ruta | Acceso |
|---|---|
| `/patients/new` | **PÚBLICA** — un paciente externo abre el link, completa y envía **sin login** |
| `/`, `/admin`, `/admin/catalogs`, `/admin/mapping`, `/exports`, `/patients/[id]`, `/patients/[id]/edit` | Protegidas — exigen sesión admin (redirigen a `/login`) |
| `/api/athenea/*` | Protegidas — cookie de sesión **o** `x-api-key` |

`/patients/new` adapta su UI a la sesión: con admin muestra el shell interno; sin
sesión usa un shell público sin navegación ni exportaciones. La escritura pública
usa la acción `createPublicPatient`, que **solo crea** (nunca lee otros pacientes)
y aplica la **misma validación** (Zod + referencias de catálogo) que el alta admin.

### ⚠️ Riesgo conocido: `/patients/new` es una ruta pública de escritura

Cualquiera con el link puede enviar registros. Hoy la única defensa es la
validación server-side (Zod + catálogos), que impide datos basura estructurales
pero **no frena volumen automatizado** (spam/flood de altas).

**Decisión actual (a propósito):** NO se agrega CAPTCHA ni anti-abuso todavía —
se prioriza la experiencia de venta/demo. Para endurecer más adelante, opciones
**livianas, sin servicios externos y sin fricción para el paciente** (propuestas,
**no** implementadas):

- **Honeypot invisible** — campo oculto que solo los bots completan; el server
  descarta el envío si viene lleno. Cero fricción, ~1 archivo.
- **Time-trap** — rechazar envíos hechos en menos de N segundos (los bots envían
  al instante). Cero fricción.
- **Rate-limit simple por IP** — N envíos por ventana de tiempo. Requiere leer la
  IP real detrás del proxy (`x-forwarded-for`) y decidir persistencia (memoria vs
  tabla Postgres si hay réplicas/reinicios).

> Nota de deploy: en producción la cookie de sesión es `secure` (requiere HTTPS).
> El despliegue real **debe ir detrás de TLS/reverse proxy**; en `localhost`
> funciona por ser contexto seguro de confianza del navegador.

## Convención de nombres de archivo

```
abad-athenea-{individual|batch}-{yyyyMMdd-HHmmss}.json
abad-athenea-excel-{yyyyMMdd-HHmmss}.xlsx
abad-athenea-manifest-{yyyyMMdd-HHmmss}.json
```

## Scripts

```bash
pnpm dev            # desarrollo (con indicador "N" de Next)
pnpm build          # build de producción (standalone)
pnpm start          # servidor de producción (sin indicador dev) — requiere build previo
pnpm start:prod     # build + start en un solo comando
pnpm docker:prod    # docker compose up -d --build (PRODUCCIÓN — default)
pnpm docker:dev     # docker compose -f docker-compose.dev.yml up -d --build (desarrollo)
pnpm lint           # ESLint
pnpm typecheck      # tsc --noEmit
pnpm test           # Vitest (unit)
pnpm test:e2e       # Playwright (requiere app+db corriendo)
pnpm prisma:seed    # sembrar catálogos + mapeo + pacientes demo
```

```bash
./scripts/backup-data.sh              # backup de la base (dump custom + SQL)
./scripts/reset-operational-data.sh   # vaciar datos operativos (backup previo + confirmación)
./deploy.sh [--seed]                  # deploy completo en VPS (ver arriba)
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
