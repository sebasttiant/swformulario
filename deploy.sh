#!/usr/bin/env bash
set -Eeuo pipefail

# ==========================================================================
# ABAD / Athenea (swformulario) — deploy en VPS
#
# Flujo: backup -> pull -> build -> db up -> app up (migra solo) -> [seed] -> verify
#
# ARQUITECTURA DE ESTE REPO (≠ droguería): solo DOS servicios, `db` + `app`.
# El contenedor `app` es Next.js standalone con la CLI de Prisma instalada, y su
# entrypoint YA aplica `prisma migrate deploy` y asegura el super admin en CADA
# arranque. Por eso NO hay servicios `migrate`/`seed` separados: las migraciones
# corren solas al levantar `app`.
#
# Catálogos/datos: el seed (catálogos + mapeo + pacientes de ejemplo) NO se corre
# por defecto para no recrear datos de ejemplo en producción. Opciones:
#   - DB nueva: poné RUN_SEED_ON_START=true en .env para la primera siembra.
#   - Refrescar catálogos en una DB existente: corré este script con `--seed`
#     (idempotente, hace upsert; OJO: también reinserta los pacientes de ejemplo).
#
# Acceso final:  http://<ip-vps>:3000   (3000 -> 3000)
# ==========================================================================

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
BACKUP_DIR="$APP_DIR/backups"
BRANCH="${BRANCH:-main}"
APP_SERVICE="${APP_SERVICE:-app}"
DB_SERVICE="${DB_SERVICE:-db}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-180}"   # segundos a esperar healthy
RUN_SEED=false

for arg in "$@"; do
  case "$arg" in
    --seed) RUN_SEED=true ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) echo "Opción desconocida: $arg" >&2; exit 1 ;;
  esac
done

cd "$APP_DIR"

# --- helper: estado de salud de un servicio (healthy / running / starting) ---
svc_health() {
  docker compose ps -q "$1" \
    | xargs -r docker inspect -f \
      '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
      2>/dev/null
}

wait_healthy() {
  local svc="$1" want="$2" deadline
  deadline=$(( $(date +%s) + HEALTH_TIMEOUT ))
  until status="$(svc_health "$svc")"; [ "$status" = "$want" ]; do
    if [ "$(date +%s)" -ge "$deadline" ]; then
      echo "ERROR: '$svc' no llegó a '$want' (estado: ${status:-desconocido}). Últimos logs:"
      docker compose logs --tail=80 "$svc"
      exit 1
    fi
    sleep 3
  done
}

echo "==> Creando backup de código..."
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/swformulario-before-deploy-$(date +%Y%m%d-%H%M%S).tar.gz"
tar --exclude='./backups' \
    --exclude='./node_modules' \
    --exclude='./.next' \
    --exclude='./.git' \
    -czf "$BACKUP_FILE" .
echo "    Backup código: $BACKUP_FILE"

# Backup de la base ANTES de tocar nada (best-effort: en el primer deploy aún no
# hay db levantada, así que no debe abortar el flujo).
if docker compose ps -q "$DB_SERVICE" >/dev/null 2>&1 && \
   [ -n "$(docker compose ps -q "$DB_SERVICE")" ]; then
  echo "==> Backup de base de datos..."
  "$APP_DIR/scripts/backup-data.sh" || echo "    (backup de DB omitido)"
fi

echo "==> Actualizando código..."
git fetch origin "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "==> Verificando .env..."
if [ ! -f "$APP_DIR/.env" ]; then
  echo "ERROR: falta $APP_DIR/.env (copialo de env.example y completá los valores)."
  exit 1
fi

echo "==> Construyendo imagen de la app..."
docker compose build "$APP_SERVICE"

echo "==> Levantando base de datos..."
docker compose up -d "$DB_SERVICE"
echo "==> Esperando a la base de datos..."
wait_healthy "$DB_SERVICE" "healthy"
docker compose ps

echo "==> Levantando app (el entrypoint aplica migraciones + super admin)..."
docker compose up -d "$APP_SERVICE"

echo "==> Esperando a que '$APP_SERVICE' quede healthy (timeout ${HEALTH_TIMEOUT}s)..."
wait_healthy "$APP_SERVICE" "healthy"
echo "    '$APP_SERVICE' está healthy."

if [ "$RUN_SEED" = true ]; then
  echo "==> Sembrando catálogos/mapeo (idempotente)..."
  docker compose exec -T "$APP_SERVICE" node prisma/seed.cjs
fi

echo "==> Verificando usuarios admin (informativo, no aborta el deploy)..."
docker compose exec -T "$DB_SERVICE" sh -lc \
  'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "select email, role from \"AdminUser\" order by role;"' \
  || echo "    (verificación omitida — la app ya está healthy)"

echo "==> Estado final:"
docker compose ps

echo "Deploy completado. App: http://<ip-vps>:3000"
