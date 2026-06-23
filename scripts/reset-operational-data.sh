#!/usr/bin/env bash
# ==========================================================================
# Reset de datos operativos — ABAD / Athenea (swformulario)
#
# Limpia datos de operación (pacientes + historial de exportaciones) preservando
# usuarios admin y catálogos/mapeo. Ejecuta backup previo por defecto y exige
# confirmación fuerte. Las migraciones NUNCA se tocan.
#
# Tablas (PascalCase, Prisma):
#   Operativas (siempre): "Patient", "ExportBatch"
#   Catálogos/mapeo (solo con --with-catalogs): "DimensionMapping", "CatalogValue", "Catalog"
#   Usuarios admin (solo con --with-users): "AdminUser"
# ==========================================================================
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
APP_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd -P)"

DB_SERVICE="${DB_SERVICE:-db}"
CONFIRM_RESET="${CONFIRM_RESET:-}"
SKIP_BACKUP="${SKIP_BACKUP:-0}"
DRY_RUN="${DRY_RUN:-0}"
WITH_CATALOGS=0
WITH_USERS=0

usage() {
  cat <<'EOF'
Uso: scripts/reset-operational-data.sh [--dry-run] [--yes] [--skip-backup] [--with-catalogs] [--with-users]

Limpieza de datos operativos. Por defecto vacía SOLO:
  - "Patient"        (pacientes)
  - "ExportBatch"    (historial de exportaciones)
Preserva usuarios admin, catálogos y mapeo. Las migraciones NUNCA se tocan.

Opciones:
  --dry-run         Prueba la limpieza dentro de una transacción y revierte todo (ROLLBACK).
  --yes             Ejecución no interactiva; requiere backup salvo --skip-backup.
  --skip-backup     Omite el backup previo. No recomendado.
  --with-catalogs   También vacía catálogos y mapeo (re-seedear luego con seed.cjs).
  --with-users      También vacía usuarios admin (el super admin se recrea al reiniciar `app`).
  --help            Muestra esta ayuda.

Variables equivalentes:
  DRY_RUN=1 CONFIRM_RESET=YES SKIP_BACKUP=1 DB_SERVICE=db
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run) DRY_RUN=1 ;;
    --yes) CONFIRM_RESET=YES ;;
    --skip-backup) SKIP_BACKUP=1 ;;
    --with-catalogs) WITH_CATALOGS=1 ;;
    --with-users) WITH_USERS=1 ;;
    --help|-h) usage; exit 0 ;;
    *) echo "ERROR: opción desconocida: $1" >&2; usage >&2; exit 1 ;;
  esac
  shift
done

cd "${APP_DIR}"

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: comando requerido no disponible: docker" >&2
  exit 1
fi

if [ ! -f "${APP_DIR}/.env" ]; then
  echo "ERROR: falta ${APP_DIR}/.env. No se ejecuta reset sin configuración de entorno." >&2
  exit 1
fi

# Lista de tablas a truncar, según flags. CASCADE resuelve el orden de FKs.
TABLES='"Patient", "ExportBatch"'
if [ "${WITH_CATALOGS}" = "1" ]; then
  TABLES="${TABLES}, \"DimensionMapping\", \"CatalogValue\", \"Catalog\""
fi
if [ "${WITH_USERS}" = "1" ]; then
  TABLES="${TABLES}, \"AdminUser\""
fi

echo "Tablas a vaciar: ${TABLES}"
echo "Catálogos/mapeo: $([ "${WITH_CATALOGS}" = 1 ] && echo 'SE VACÍAN' || echo 'se preservan')"
echo "Usuarios admin : $([ "${WITH_USERS}" = 1 ] && echo 'SE VACÍAN' || echo 'se preservan')"
echo "Migraciones    : NUNCA se tocan"

if [ "${DRY_RUN}" = "1" ]; then
  echo "DRY_RUN=1: se probará el SQL dentro de una transacción y se hará ROLLBACK."
elif [ "${CONFIRM_RESET}" != "YES" ]; then
  echo "ADVERTENCIA: esto BORRA los datos operativos listados arriba."
  echo "Se ejecutará un backup previo automáticamente antes de borrar."
  read -r -p "Para continuar escribí exactamente BORRAR DATOS OPERATIVOS: " confirmation
  if [ "${confirmation}" != "BORRAR DATOS OPERATIVOS" ]; then
    echo "Reset cancelado."
    exit 1
  fi
fi

if [ "${DRY_RUN}" = "1" ]; then
  echo "DRY_RUN=1: se omite backup previo porque no se persistirán cambios."
elif [ "${SKIP_BACKUP}" != "1" ]; then
  echo "Ejecutando backup previo..."
  "${SCRIPT_DIR}/backup-data.sh"
else
  echo "SKIP_BACKUP=1 definido; se omite backup previo."
fi

if [ "${DRY_RUN}" = "1" ]; then
  echo "Probando limpieza en PostgreSQL (sin persistir cambios)..."
else
  echo "Limpiando datos operativos en PostgreSQL..."
fi

docker compose exec -T -e DRY_RUN="${DRY_RUN}" -e RESET_TABLES="${TABLES}" "${DB_SERVICE}" \
  sh -lc 'psql -v ON_ERROR_STOP=1 -v dry_run="$DRY_RUN" -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<SQL
BEGIN;
TRUNCATE TABLE ${RESET_TABLES} RESTART IDENTITY CASCADE;
\if :dry_run
  \echo DRY_RUN activo: se revierte la transaccion. No se borro nada.
  ROLLBACK;
\else
  COMMIT;
\endif
SQL'

if [ "${DRY_RUN}" = "1" ]; then
  echo "DRY_RUN OK. No se borró nada."
else
  echo "Reset operativo OK."
  if [ "${WITH_CATALOGS}" = "1" ]; then
    echo "Catálogos vaciados — re-seedealos con: docker compose exec app node prisma/seed.cjs"
  fi
  if [ "${WITH_USERS}" = "1" ]; then
    echo "Usuarios vaciados — reiniciá la app para recrear el super admin: docker compose restart app"
  fi
fi
