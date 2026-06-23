import { prisma } from "@/lib/db/prisma";
import { getConfig } from "@/lib/config/env";
import {
  buildAtheneaPayload,
  findMissingRequiredValues,
  type AtheneaPayload,
} from "./athenea-payload";
import { resolvePatientToInput, buildAtheneaValueMap } from "./resolve-patient";

/**
 * Shared Athenea payload generation used by BOTH the file-export actions and the
 * REST API routes (`/api/athenea/...`). Single source of truth so the JSON a
 * machine consumer pulls is byte-for-byte identical to what gets downloaded —
 * exactly the documented `InsPaciente` shape Athenea's ERP expects.
 */
export interface BuiltPayloads {
  payloads: AtheneaPayload[];
  patientIds: string[];
  mappingVersion: number;
  warnings: string[];
}

export async function buildPayloadsForPatients(
  patientIds?: string[],
): Promise<BuiltPayloads> {
  const config = getConfig();

  // `undefined` (no argument) means "all patients" — used only by the REST API's
  // unfiltered batch call. An explicit ARRAY (even empty) is treated as an exact
  // selection: an empty array matches nothing, so a partial/empty UI selection
  // can never accidentally export every patient.
  const patients = await prisma.patient.findMany({
    where: patientIds ? { id: { in: patientIds } } : undefined,
    orderBy: { createdAt: "asc" },
  });

  const [catalogValues, mappings] = await Promise.all([
    prisma.catalogValue.findMany({ select: { id: true, atheneaValue: true } }),
    prisma.dimensionMapping.findMany({ where: { active: true } }),
  ]);

  const atheneaValueById = buildAtheneaValueMap(catalogValues);
  const mappingVersion = mappings.reduce((max, m) => Math.max(max, m.version), 1);
  const placeholderActive = mappings.some((m) => m.version === 1);

  const payloads = patients.map((patient) =>
    buildAtheneaPayload(
      resolvePatientToInput(patient, { atheneaValueById, mappings }),
      { sexExportKey: config.sexExportKey, dateFormat: config.atheneaDateFormat },
    ),
  );

  const warnings: string[] = [];
  if (placeholderActive) {
    warnings.push(
      "El mapeo D0-D9 y/o los IDs de catálogo son PLACEHOLDER. Verificar contra Athenea antes de importar.",
    );
  }

  // Fail loudly (as a warning) when a required Athenea value resolved to empty —
  // e.g. a catalog value with an empty/missing atheneaValue.
  payloads.forEach((payload, index) => {
    const missing = findMissingRequiredValues(payload, config.sexExportKey);
    if (missing.length) {
      const patient = patients[index];
      warnings.push(
        `Paciente ${patient.documentNumber}: faltan valores Athenea requeridos (${missing.join(", ")}). Revisar catálogos/mapeo.`,
      );
    }
  });

  warnings.push(
    `Clave de sexo='${config.sexExportKey}', formato fecha='${config.atheneaDateFormat}' (configurables).`,
  );

  return {
    payloads,
    patientIds: patients.map((p) => p.id),
    mappingVersion,
    warnings,
  };
}
