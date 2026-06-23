"use server";

import { prisma } from "@/lib/db/prisma";
import { getConfig } from "@/lib/config/env";
import { requireAdmin, currentOperator } from "@/lib/auth/session";
import { buildPayloadsForPatients } from "./athenea-service";
import { buildExcelBuffer } from "./excel-export";
import { exportFilename, manifestFilename, type ExportType } from "./filename";
import { buildManifest, type ExportManifest } from "./manifest";

export interface ExportResult {
  ok: boolean;
  error?: string;
  filename?: string;
  manifestFilename?: string;
  mimeType?: string;
  /** base64-encoded file content (JSON or XLSX). */
  contentBase64?: string;
  /** base64-encoded manifest JSON. */
  manifestBase64?: string;
  manifest?: ExportManifest;
}

const MIME: Record<ExportType, string> = {
  individual: "application/json",
  batch: "application/json",
  excel: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

function toBase64(text: string): string {
  return Buffer.from(text, "utf-8").toString("base64");
}

/**
 * Generate an Athenea export (individual JSON, batch JSON, or Excel) plus its
 * audit manifest. Returns base64 payloads so the client can trigger downloads.
 */
export async function exportPatients(
  type: ExportType,
  patientIds: string[],
): Promise<ExportResult> {
  await requireAdmin();
  const config = getConfig();

  // Require an explicit selection. Without this guard an empty list would fall
  // through to "export all" — never export unselected patients by accident.
  if (patientIds.length === 0) {
    return { ok: false, error: "Seleccione al menos un paciente para exportar." };
  }
  if (type === "individual" && patientIds.length !== 1) {
    return { ok: false, error: "Seleccione exactamente un paciente." };
  }

  const { payloads, patientIds: resolvedIds, mappingVersion, warnings } =
    await buildPayloadsForPatients(patientIds);

  if (payloads.length === 0) {
    return { ok: false, error: "No hay pacientes para exportar." };
  }

  const now = new Date();
  const filename = exportFilename(type, now);
  const manifestName = manifestFilename(now);

  let contentBase64: string;
  if (type === "excel") {
    const buffer = await buildExcelBuffer(payloads, config.sexExportKey);
    contentBase64 = buffer.toString("base64");
  } else {
    const json =
      type === "individual"
        ? JSON.stringify(payloads[0], null, 2)
        : JSON.stringify(payloads, null, 2);
    contentBase64 = toBase64(json);
  }

  const manifest = buildManifest({
    generatedAt: now,
    generatedBy: await currentOperator(),
    type,
    filename,
    patientIds: resolvedIds,
    mappingVersion,
    warnings,
  });

  try {
    await prisma.exportBatch.create({
      data: {
        type,
        filename,
        manifestFilename: manifestName,
        patientCount: resolvedIds.length,
        mappingVersion,
      },
    });
  } catch (error) {
    console.error("Failed to record export batch", error);
  }

  return {
    ok: true,
    filename,
    manifestFilename: manifestName,
    mimeType: MIME[type],
    contentBase64,
    manifestBase64: toBase64(JSON.stringify(manifest, null, 2)),
    manifest,
  };
}
