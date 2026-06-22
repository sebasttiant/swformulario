import ExcelJS from "exceljs";
import type { AtheneaPayload, DimensionKey } from "./athenea-payload";
import { DIMENSION_KEYS } from "./athenea-payload";
import type { SexExportKey } from "@/lib/config/env";

/**
 * Excel export — one row per patient, columns matching the Athenea payload.
 * The gender column honors the configurable export key (`SEXO` or `IDSEXO`), and
 * `DIMENSIONESVARIABLES` is flattened into ENTIDAD / PLAN columns.
 */

export type FlatRow = Record<string, string>;

/** Flatten a payload into a single, spreadsheet-friendly record. The gender
 * value is placed under the configured key so Excel stays consistent with JSON. */
export function flattenPayload(
  payload: AtheneaPayload,
  sexExportKey: SexExportKey,
): FlatRow {
  const row: FlatRow = {
    TIPOIDENTIFICACION: String(payload.TIPOIDENTIFICACION ?? ""),
    NUMEROIDENTIFICACION: String(payload.NUMEROIDENTIFICACION ?? ""),
    FECHANACIMIENTO: String(payload.FECHANACIMIENTO ?? ""),
    NOMBRE1: String(payload.NOMBRE1 ?? ""),
    NOMBRE2: String(payload.NOMBRE2 ?? ""),
    APELLIDO1: String(payload.APELLIDO1 ?? ""),
    APELLIDO2: String(payload.APELLIDO2 ?? ""),
    [sexExportKey]: String(payload[sexExportKey] ?? ""),
    ACTIVO: payload.ACTIVO ? "true" : "false",
  };
  for (const key of DIMENSION_KEYS as readonly DimensionKey[]) {
    row[key] = String(payload[key] ?? "");
  }
  row.ENTIDAD = String(payload.DIMENSIONESVARIABLES?.ENTIDAD ?? "");
  row.PLAN = String(payload.DIMENSIONESVARIABLES?.PLAN ?? "");
  return row;
}

/** Column order for the worksheet, with the gender column placed by its key. */
export function excelColumns(sexExportKey: SexExportKey): string[] {
  return [
    "TIPOIDENTIFICACION",
    "NUMEROIDENTIFICACION",
    "FECHANACIMIENTO",
    "NOMBRE1",
    "NOMBRE2",
    "APELLIDO1",
    "APELLIDO2",
    sexExportKey,
    "ACTIVO",
    ...DIMENSION_KEYS,
    "ENTIDAD",
    "PLAN",
  ];
}

export async function buildExcelBuffer(
  payloads: AtheneaPayload[],
  sexExportKey: SexExportKey,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ABAD Laboratorio";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Pacientes");

  sheet.columns = excelColumns(sexExportKey).map((key) => ({
    header: key,
    key,
    width: Math.max(14, key.length + 2),
  }));
  sheet.getRow(1).font = { bold: true };

  for (const payload of payloads) {
    sheet.addRow(flattenPayload(payload, sexExportKey));
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
