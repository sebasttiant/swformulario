import type { ExportType } from "./filename";

/**
 * Export manifest — an audit record that travels with every export so the
 * Athenea import operator knows exactly what was generated, from which mapping
 * version, and which placeholder warnings apply.
 */
export interface ExportManifest {
  generatedAt: string;
  generatedBy: string | null;
  type: ExportType;
  filename: string;
  patientIds: string[];
  patientCount: number;
  mappingVersion: number;
  warnings: string[];
}

export interface BuildManifestInput {
  generatedAt: Date;
  generatedBy?: string | null;
  type: ExportType;
  filename: string;
  patientIds: string[];
  mappingVersion: number;
  /** Extra warnings (e.g. placeholder catalogs/mappings detected). */
  warnings?: string[];
}

export function buildManifest(input: BuildManifestInput): ExportManifest {
  return {
    generatedAt: input.generatedAt.toISOString(),
    generatedBy: input.generatedBy ?? null,
    type: input.type,
    filename: input.filename,
    patientIds: [...input.patientIds],
    patientCount: input.patientIds.length,
    mappingVersion: input.mappingVersion,
    warnings: input.warnings ? [...input.warnings] : [],
  };
}
