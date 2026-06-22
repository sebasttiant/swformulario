import type { SexExportKey } from "@/lib/config/env";
import { formatWithPattern } from "@/lib/utils/date";

/**
 * Centralized Athenea `InsPaciente` payload builder.
 *
 * This is the single source of truth for the export contract documented in
 * DOCUMENTOS/REST API DATOS PACIENTES V.1.0.pdf (page 10). It is a PURE function
 * so it can be exhaustively unit-tested without a database.
 *
 * KNOWN UNKNOWNS (handled here, documented in HANDOFF.md):
 *  - Gender key: the request table says `IDSEXO` (Int) but the sample payload
 *    uses `SEXO`. The key is configurable via `config.sexExportKey`.
 *  - FECHANACIMIENTO format is not specified. Configurable via `config.dateFormat`.
 *  - Athenea catalog IDs are NOT hardcoded — callers pass already-resolved
 *    `CatalogValue.atheneaValue` strings.
 *  - Empty/optional handling is centralized in `orEmpty` below.
 */

export const DIMENSION_KEYS = [
  "D0",
  "D1",
  "D2",
  "D3",
  "D4",
  "D5",
  "D6",
  "D7",
  "D8",
  "D9",
] as const;

export type DimensionKey = (typeof DIMENSION_KEYS)[number];

export interface AtheneaPatientInput {
  /** Resolved CatalogValue.atheneaValue for the document type. */
  documentTypeAtheneaValue: string;
  /** Always exported as the exact string the operator entered. */
  documentNumber: string;
  birthDate: Date;
  firstName: string;
  secondName?: string | null;
  firstSurname: string;
  secondSurname?: string | null;
  /** Resolved CatalogValue.atheneaValue for sex. */
  sexAtheneaValue: string;
  active: boolean;
  /** D0..D9 values, already resolved to their Athenea values. */
  dimensions: Partial<Record<DimensionKey, string>>;
  /** DIMENSIONESVARIABLES.ENTIDAD (resolved Athenea value). */
  entidad?: string | null;
  /** DIMENSIONESVARIABLES.PLAN (resolved Athenea value). */
  plan?: string | null;
}

export interface AtheneaExportConfig {
  sexExportKey: SexExportKey;
  dateFormat: string;
}

export interface AtheneaPayload {
  TIPOIDENTIFICACION: string;
  NUMEROIDENTIFICACION: string;
  FECHANACIMIENTO: string;
  NOMBRE1: string;
  NOMBRE2: string;
  APELLIDO1: string;
  APELLIDO2: string;
  ACTIVO: boolean;
  D0: string;
  D1: string;
  D2: string;
  D3: string;
  D4: string;
  D5: string;
  D6: string;
  D7: string;
  D8: string;
  D9: string;
  DIMENSIONESVARIABLES: {
    ENTIDAD: string;
    PLAN: string;
  };
  // Gender is emitted under SEXO or IDSEXO depending on config.
  [genderKey: string]: string | boolean | object;
}

/** Centralized optional/empty handling — Athenea sample uses empty strings. */
function orEmpty(value: string | null | undefined): string {
  return value == null ? "" : String(value);
}

/** Format FECHANACIMIENTO. Exact Athenea format is UNKNOWN — see HANDOFF.md. */
export function formatAtheneaDate(date: Date, pattern: string): string {
  return formatWithPattern(date, pattern);
}

/**
 * Athenea `InsPaciente` fields marked "Requerido = SI" in the PDF (excluding the
 * boolean ACTIVO and the gender key, which is checked separately because its name
 * is configurable). Used to detect silently-empty exports.
 */
export const REQUIRED_ATHENEA_FIELDS = [
  "TIPOIDENTIFICACION",
  "NUMEROIDENTIFICACION",
  "FECHANACIMIENTO",
  "NOMBRE1",
  "APELLIDO1",
] as const;

/** Return the required Athenea keys that resolved to an empty value. */
export function findMissingRequiredValues(
  payload: AtheneaPayload,
  sexExportKey: SexExportKey,
): string[] {
  const missing: string[] = [];
  for (const key of REQUIRED_ATHENEA_FIELDS) {
    if (!String(payload[key] ?? "").trim()) missing.push(key);
  }
  if (!String(payload[sexExportKey] ?? "").trim()) missing.push(sexExportKey);
  return missing;
}

export function buildAtheneaPayload(
  input: AtheneaPatientInput,
  config: AtheneaExportConfig,
): AtheneaPayload {
  const payload: AtheneaPayload = {
    TIPOIDENTIFICACION: orEmpty(input.documentTypeAtheneaValue),
    NUMEROIDENTIFICACION: orEmpty(input.documentNumber),
    FECHANACIMIENTO: formatAtheneaDate(input.birthDate, config.dateFormat),
    NOMBRE1: orEmpty(input.firstName),
    NOMBRE2: orEmpty(input.secondName),
    APELLIDO1: orEmpty(input.firstSurname),
    APELLIDO2: orEmpty(input.secondSurname),
    // Gender key is configurable (SEXO vs IDSEXO).
    [config.sexExportKey]: orEmpty(input.sexAtheneaValue),
    ACTIVO: input.active,
    D0: orEmpty(input.dimensions.D0),
    D1: orEmpty(input.dimensions.D1),
    D2: orEmpty(input.dimensions.D2),
    D3: orEmpty(input.dimensions.D3),
    D4: orEmpty(input.dimensions.D4),
    D5: orEmpty(input.dimensions.D5),
    D6: orEmpty(input.dimensions.D6),
    D7: orEmpty(input.dimensions.D7),
    D8: orEmpty(input.dimensions.D8),
    D9: orEmpty(input.dimensions.D9),
    DIMENSIONESVARIABLES: {
      ENTIDAD: orEmpty(input.entidad),
      PLAN: orEmpty(input.plan),
    },
  };
  return payload;
}
