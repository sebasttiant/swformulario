import { prisma } from "@/lib/db/prisma";
import type { PatientParsed } from "@/features/patients/patient-schema";
import type { CatalogKey } from "./catalog-schema";

/**
 * Server-side validation that catalog references on a patient actually exist, are
 * active, and belong to the EXPECTED catalog. Zod only checks that the ids are
 * non-empty strings — without this, an action could persist a bogus catalog id
 * that later exports as an empty Athenea value.
 */

type PatientField = keyof PatientParsed;

const REQUIRED_REFS: Array<[PatientField, CatalogKey]> = [
  ["documentTypeId", "documentType"],
  ["sexCatalogValueId", "sex"],
  ["cityCatalogValueId", "city"],
  ["residentialZoneCatalogValueId", "residentialZone"],
  ["nationalityCatalogValueId", "nationality"],
  ["userTypeCatalogValueId", "userType"],
  ["insurerCatalogValueId", "insurer"],
  ["patientOriginCatalogValueId", "patientOrigin"],
  ["documentExpeditionCityCatalogValueId", "documentExpeditionCity"],
];

const OPTIONAL_REFS: Array<[PatientField, CatalogKey]> = [
  ["treatmentCatalogValueId", "treatment"],
  ["entityCatalogValueId", "entity"],
  ["planCatalogValueId", "plan"],
];

export type RefValidation =
  | { ok: true }
  | { ok: false; fieldErrors: Record<string, string[]> };

export async function validateCatalogRefs(
  parsed: PatientParsed,
): Promise<RefValidation> {
  const ids = [...REQUIRED_REFS, ...OPTIONAL_REFS]
    .map(([field]) => parsed[field])
    .filter((v): v is string => typeof v === "string" && v.length > 0);

  const rows = ids.length
    ? await prisma.catalogValue.findMany({
        where: { id: { in: ids } },
        select: { id: true, active: true, catalog: { select: { key: true } } },
      })
    : [];

  const byId = new Map(
    rows.map((r) => [r.id, { active: r.active, key: r.catalog.key }]),
  );

  const fieldErrors: Record<string, string[]> = {};
  const check = (field: PatientField, expected: CatalogKey, required: boolean) => {
    const id = parsed[field] as string | undefined;
    if (!id) {
      if (required) fieldErrors[field] = ["Selección obligatoria."];
      return;
    }
    const found = byId.get(id);
    if (!found) {
      fieldErrors[field] = ["La opción seleccionada no existe."];
    } else if (found.key !== expected) {
      fieldErrors[field] = ["La opción no corresponde a este campo."];
    } else if (!found.active) {
      fieldErrors[field] = ["La opción seleccionada está inactiva."];
    }
  };

  for (const [field, key] of REQUIRED_REFS) check(field, key, true);
  for (const [field, key] of OPTIONAL_REFS) check(field, key, false);

  return Object.keys(fieldErrors).length ? { ok: false, fieldErrors } : { ok: true };
}
