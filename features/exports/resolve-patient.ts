import type { Patient, DimensionMapping } from "@prisma/client";
import {
  DIMENSION_KEYS,
  type AtheneaPatientInput,
  type DimensionKey,
} from "./athenea-payload";

/**
 * Bridge between persisted data and the pure Athenea payload builder.
 *
 * It resolves the database patient + the admin-editable D0-D9 mapping into the
 * normalized, already-resolved input the builder expects. Catalog references are
 * translated to their `CatalogValue.atheneaValue` via `atheneaValueById`; raw
 * fields (e.g. address) are passed through verbatim.
 *
 * Kept dependency-free (no Prisma client calls) so it is unit-testable.
 */

export interface ResolveDeps {
  /** CatalogValue.id -> CatalogValue.atheneaValue */
  atheneaValueById: Map<string, string>;
  /** Active dimension mappings (D0..D9, ENTIDAD, PLAN). */
  mappings: DimensionMapping[];
}

function readField(patient: Patient, field: string): string {
  if (!field) return "";
  const raw = (patient as unknown as Record<string, unknown>)[field];
  if (raw == null) return "";
  if (raw instanceof Date) return raw.toISOString();
  return String(raw);
}

/**
 * Catalog source field -> the patient free-text field that overrides it when the
 * "Otro" option is selected. When the operator picked "Otro", the typed value is
 * exported verbatim instead of the placeholder catalog Athenea value.
 */
const OTHER_TEXT_FIELD: Record<string, string> = {
  cityCatalogValueId: "cityOther",
  nationalityCatalogValueId: "nationalityOther",
};

/** Resolve one mapping's source value (catalog -> athenea value, or raw field). */
function resolveMappingValue(
  patient: Patient,
  mapping: DimensionMapping,
  atheneaValueById: Map<string, string>,
): string {
  const fieldValue = readField(patient, mapping.sourceField);
  if (!fieldValue) return "";
  if (mapping.catalogKey) {
    // "Otro" free text wins over the catalog placeholder value when present.
    const otherField = OTHER_TEXT_FIELD[mapping.sourceField];
    if (otherField) {
      const otherText = readField(patient, otherField).trim();
      if (otherText) return otherText;
    }
    // sourceField holds a CatalogValue id -> translate to its Athenea value.
    return atheneaValueById.get(fieldValue) ?? "";
  }
  return fieldValue;
}

export function resolvePatientToInput(
  patient: Patient,
  deps: ResolveDeps,
): AtheneaPatientInput {
  const { atheneaValueById, mappings } = deps;
  const byKey = new Map(mappings.map((m) => [m.dimensionKey, m]));

  const dimensions: Partial<Record<DimensionKey, string>> = {};
  for (const key of DIMENSION_KEYS) {
    const mapping = byKey.get(key);
    if (mapping && mapping.active) {
      dimensions[key] = resolveMappingValue(patient, mapping, atheneaValueById);
    }
  }

  const entidadMapping = byKey.get("ENTIDAD");
  const planMapping = byKey.get("PLAN");

  return {
    documentTypeAtheneaValue: atheneaValueById.get(patient.documentTypeId) ?? "",
    documentNumber: patient.documentNumber,
    birthDate: patient.birthDate,
    firstName: patient.firstName,
    secondName: patient.secondName,
    firstSurname: patient.firstSurname,
    secondSurname: patient.secondSurname,
    sexAtheneaValue: atheneaValueById.get(patient.sexCatalogValueId) ?? "",
    active: patient.active,
    dimensions,
    entidad: entidadMapping
      ? resolveMappingValue(patient, entidadMapping, atheneaValueById)
      : "",
    plan: planMapping
      ? resolveMappingValue(patient, planMapping, atheneaValueById)
      : "",
  };
}

/** Build the id -> atheneaValue lookup from raw catalog value rows. */
export function buildAtheneaValueMap(
  values: Array<{ id: string; atheneaValue: string }>,
): Map<string, string> {
  return new Map(values.map((v) => [v.id, v.atheneaValue]));
}
