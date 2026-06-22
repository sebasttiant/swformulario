/**
 * Centralized runtime configuration.
 *
 * Reads are lazy and tolerant so `next build` does not fail when the database
 * URL is absent at build time. Athenea-specific knobs live here because several
 * contract details are still UNKNOWN (see HANDOFF.md) and must stay configurable
 * rather than hardcoded inside the export builder.
 */

/** Athenea gender export key. The PDF is internally inconsistent: the request
 * table documents `IDSEXO` (Int) while the sample payload uses `SEXO`. Default
 * to `SEXO` (matches the sample) and allow overriding via env. */
export type SexExportKey = "SEXO" | "IDSEXO";

export interface AppConfig {
  databaseUrl: string;
  adminPassword: string;
  sessionSecret: string;
  /** Optional API key for machine access to the /api/athenea REST endpoints. */
  exportApiKey: string;
  /** Which key Athenea expects for gender. UNKNOWN — see HANDOFF.md. */
  sexExportKey: SexExportKey;
  /** date-fns format string for FECHANACIMIENTO. UNKNOWN — see HANDOFF.md. */
  atheneaDateFormat: string;
}

function readSexExportKey(): SexExportKey {
  const raw = process.env.ATHENEA_SEX_EXPORT_KEY?.trim().toUpperCase();
  return raw === "IDSEXO" ? "IDSEXO" : "SEXO";
}

/**
 * Read a secret with a dev-only fallback. In production the dev defaults are a
 * security hazard, so a missing value fails fast instead of silently weakening
 * auth. Dev/test keep the convenient default.
 */
function readSecret(name: "ADMIN_PASSWORD" | "SESSION_SECRET", devFallback: string): string {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      `${name} must be set in production (no insecure default is allowed).`,
    );
  }
  return devFallback;
}

export function getConfig(): AppConfig {
  return {
    databaseUrl: process.env.DATABASE_URL ?? "",
    adminPassword: readSecret("ADMIN_PASSWORD", "abad-admin"),
    sessionSecret: readSecret("SESSION_SECRET", "dev-session-secret-change-me"),
    exportApiKey: process.env.EXPORT_API_KEY?.trim() ?? "",
    sexExportKey: readSexExportKey(),
    atheneaDateFormat: process.env.ATHENEA_DATE_FORMAT?.trim() || "yyyy-MM-dd",
  };
}
