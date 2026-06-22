# HANDOFF — ABAD / Athenea Patient Registration MVP

For OpenCode audit and for the next implementer. This MVP is **export-first**:
patients are captured locally and exported in the exact Athenea `InsPaciente`
shape. There is **no live API submission** (blocked — see below).

## 1. What was implemented

- Next.js 16 App Router app under `swformulario/` (TypeScript strict).
- ABAD-branded UI (red blood-drop + charcoal), Spanish, mobile/tablet friendly.
- Admin gate via single `ADMIN_PASSWORD` + HMAC-signed cookie (`lib/auth/session.ts`).
- **Patient wizard** (7 steps): document verification → identification → contact
  → location → administrative → Habeas Data → editable summary. Per-step Zod
  validation, visual age, `Sin correo`, Colombian mobile rule.
- **Persistence** in PostgreSQL via Prisma 7 (driver adapter `@prisma/adapter-pg`).
- **Admin**: patient list + search, detail, **edit persisted patient** (reuses the
  wizard), catalog value editor (with `atheneaValue`), and **D0-D9 mapping editor**.
- **Exports** (centralized, pure builder):
  - Individual `InsPaciente` JSON
  - Batch JSON (array of `InsPaciente`)
  - Excel `.xlsx` (one row per patient)
  - Audit **manifest** JSON per export (counts, ids, mapping version, warnings)
  - `ExportBatch` history recorded in DB
- **Machine REST API** in Athenea format:
  - `GET /api/athenea/patients` (batch) and `GET /api/athenea/patients/:id`
  - Auth: admin cookie **or** `x-api-key: <EXPORT_API_KEY>`
- **Health** endpoint `GET /api/health` (DB ping) for Docker healthcheck.
- **Docker**: multi-stage Dockerfile (`deps`/`build`/`dev`/`runner`), non-root
  runner, healthcheck, standalone output. Two services only (`app` + `db`) in both
  `docker-compose.yml` (dev, hot reload, auto migrate+seed) and
  `docker-compose.prod.yml` (standalone, migrate on boot).
- **Seed** with placeholder catalogs, default D0-D9 mapping, and 2 sample patients.
- **Tests**: Vitest unit suite + Playwright smoke.

## 1.b Audit fixes applied (post first pass)

1. **Fresh prod DB seed path** — `docker-entrypoint.sh` now seeds when
   `RUN_SEED_ON_START=true` (idempotent upserts, never destructive). Manual path:
   `docker compose -f docker-compose.prod.yml exec app node prisma/seed.cjs`. The
   seed is pre-bundled with esbuild in the build stage (`prisma/seed.cjs`,
   `@prisma/client` external) so the slim runner seeds with plain `node` — Next
   bundles deps like `@prisma/adapter-pg`/`zod` into the server output, which makes
   them unresolvable for a loose `tsx` script. Documented in README → "Sembrar una
   DB de producción/demo nueva".
2. **Excel honors `IDSEXO`** — `excel-export.ts` places the gender value/column
   under the configured key (`SEXO` or `IDSEXO`). Tests cover both
   (`tests/unit/excel-export.test.ts`).
3. **Catalog refs validated server-side** — `features/catalogs/validate-refs.ts`
   checks every catalog id exists, is active, and belongs to the expected catalog,
   before create/update. The export service adds a per-patient warning when a
   required Athenea value resolves empty (`findMissingRequiredValues`). Tests:
   `tests/unit/athenea-payload.test.ts` (missing/invalid mapping).
4. **Wizard forward-jump guard** — jumping ahead in the stepper validates every
   intermediate step; on submit failure (client or server) the wizard jumps to the
   first step containing an error.
5. **Summary "Documento" edit** → goes to step 0 (was step 1).
6. **Export selection UX** — helper text "Seleccione uno o más pacientes…" plus the
   existing "select all" header checkbox.
7. **Prod compose hardening** — `POSTGRES_PASSWORD` is now required (no `abad`
   default) alongside `ADMIN_PASSWORD` and `SESSION_SECRET`. Dev compose keeps
   convenient defaults.
8. **Auth fail-fast in prod** — `lib/config/env.ts` only uses dev defaults when
   `NODE_ENV !== "production"`; in production a missing `ADMIN_PASSWORD` /
   `SESSION_SECRET` throws instead of silently weakening auth.

## 2. Commands run and results

| Command | Result |
| ------- | ------ |
| `pnpm typecheck` (`tsc --noEmit`) | ✅ clean |
| `pnpm lint` | ✅ 0 errors, 1 benign warning (React Compiler + RHF `watch`) |
| `pnpm test` (Vitest) | ✅ **18/18 passing** (payload, filename, manifest, schema) |
| `pnpm build` | ✅ compiles, 10 routes (all dynamic) |
| `prisma migrate dev` + `prisma:seed` (against Postgres 18) | ✅ migration `init` applied, seed OK |
| `GET /api/health` (running server) | ✅ `{"status":"ok","db":"up"}` |
| `GET /` without session | ✅ 307 → `/login` |
| Docker image build (`--target runner`) | Built with `--network=host` in the sandbox (the sandbox denies the build network DNS; on a normal machine `docker compose up --build` works directly). |

> NOTE on environment: in this sandbox, **writing `.env*` is blocked** and the
> **Docker build has no network DNS** unless `--network=host` is used. Neither is a
> problem on a normal developer machine. The env example ships as `env.example`
> (`cp env.example .env`). Compose injects env vars directly, so no `.env` is
> strictly required for Docker.

## 3. What was NOT implemented (out of scope)

- Live Athenea JWT auth + `insPaciente` POST submission (blocked — no auth doc).
- Results / lab report UI (`WSLAB` API is future context only).
- Redis, queues, microservices, nginx, background workers.
- Complex RBAC / multi-user / multi-tenant / payments.
- `GetPacienteByTipoId` lookup in Step 0 (only local format validation, as scoped).

## 4. Known blockers and UNKNOWNS (must confirm with Athenea)

These are deliberately **configurable / editable**, never hardcoded:

1. **JWT auth** — the authentication document and credentials are missing, so no
   direct API submission. Export files/endpoints are the bridge meanwhile.
2. **`SEXO` vs `IDSEXO`** — the patient API PDF is internally inconsistent: the
   request table lists `IDSEXO` (Int) but the sample payload uses `SEXO`. Default
   is `SEXO`; override with `ATHENEA_SEX_EXPORT_KEY`. One switch, one place
   (`lib/config/env.ts` → `features/exports/athenea-payload.ts`).
3. **`FECHANACIMIENTO` format** — not specified in the docs. Default `yyyy-MM-dd`;
   override with `ATHENEA_DATE_FORMAT`. Formatting is UTC-stable.
4. **D0-D9 mapping** — Athenea does not document which patient field maps to which
   dimension. The seed proposes a mapping at **version 1 (= placeholder)**; the
   admin Mapping editor lets you change it (saving bumps to version 2 and clears
   the placeholder warning). Exports/manifests warn while any mapping is at v1.
5. **Catalog Athenea IDs** — all `CatalogValue.atheneaValue` are **placeholders**.
   Replace them in Admin → Catálogos with the real Athenea IDs. The builder always
   emits exactly `CatalogValue.atheneaValue`, never a hardcoded constant.
6. **Empty/optional handling** — Athenea's preference (empty string vs omit vs
   null) is unconfirmed. Centralized in `orEmpty()` (currently empty strings, as in
   the sample payload).

## 5. How to run

### Docker (dev — hot reload, auto migrate+seed)
```bash
cd swformulario
docker compose up --build
# http://localhost:3000  · login with ADMIN_PASSWORD (default abad-admin)
```

### Docker (prod-like — standalone, migrate on boot)
```bash
export ADMIN_PASSWORD=secure SESSION_SECRET=secret
docker compose -f docker-compose.prod.yml up --build
docker compose -f docker-compose.prod.yml ps
```

### Local (no Docker)
```bash
cp env.example .env
pnpm install
pnpm prisma migrate deploy && pnpm prisma:seed
pnpm dev
```

### Seed
```bash
pnpm prisma:seed   # idempotent (upserts)
```

## 6. How to audit the exports

1. Log in, go to **Exportaciones**, select patients, generate **JSON lote** /
   **Excel**. Each download also produces a manifest JSON.
2. Compare the JSON against the PDF sample (`DOCUMENTOS/REST API DATOS PACIENTES
   V.1.0.pdf`, page 10). Keys must match exactly:
   `TIPOIDENTIFICACION, NUMEROIDENTIFICACION, FECHANACIMIENTO, NOMBRE1, NOMBRE2,
   APELLIDO1, APELLIDO2, SEXO|IDSEXO, ACTIVO, D0..D9, DIMENSIONESVARIABLES{ENTIDAD,PLAN}`.
3. Machine check (exact Athenea object):
   ```bash
   curl -H "x-api-key: $EXPORT_API_KEY" http://localhost:3000/api/athenea/patients/<id>
   ```
4. Unit tests pin the contract: `pnpm test`.

## 7. Files OpenCode should review first (hotspots)

1. `features/exports/athenea-payload.ts` — the InsPaciente contract (pure builder).
2. `features/exports/resolve-patient.ts` — DB → payload bridge + D0-D9 resolution.
3. `features/exports/athenea-service.ts` — shared builder for files + REST API.
4. `features/exports/excel-export.ts` — xlsx flattening.
5. `features/exports/manifest.ts` + `filename.ts` — audit + naming.
6. `prisma/schema.prisma` + `prisma/seed.ts` — model, placeholder catalogs, mapping.
7. `features/patients/patient-schema.ts` — Zod source of truth (validation rules).
8. `features/catalogs/mapping-editor.tsx` — config-driven D0-D9 editing.
9. `Dockerfile` + `docker-compose*.yml` + `docker-entrypoint.sh` — 2-service setup.
10. `app/api/athenea/**` + `lib/auth/api-access.ts` — REST surface + auth.

## 8. Notes / decisions

- Prisma 7 removed `url` from `schema.prisma`; connection lives in
  `prisma.config.ts` (migrate) and the `@prisma/adapter-pg` adapter (runtime).
- Catalog references on `Patient` are plain `CatalogValue.id` strings (no hard FK)
  for MVP simplicity and full editability.
- The prod runner installs a global `prisma` CLI so `migrate deploy` runs at boot
  without depending on pnpm's symlinked `node_modules`.
