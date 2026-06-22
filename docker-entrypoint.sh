#!/bin/sh
set -e

# Apply pending migrations before starting the standalone server.
# Uses the globally-installed Prisma CLI and DATABASE_URL from the environment.
echo "[entrypoint] Applying database migrations…"
prisma migrate deploy

# Optional, idempotent seed for fresh prod/demo databases. The seed UPSERTS
# (never destructively overwrites). Opt in with RUN_SEED_ON_START=true.
if [ "${RUN_SEED_ON_START}" = "true" ]; then
  echo "[entrypoint] RUN_SEED_ON_START=true → seeding catalogs, mapping and demo data…"
  node prisma/seed.cjs
fi

echo "[entrypoint] Starting application…"
exec "$@"
