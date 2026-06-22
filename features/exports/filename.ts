import { formatTimestamp } from "@/lib/utils/date";

/**
 * Export filename conventions (see HANDOFF.md):
 *   abad-athenea-{type}-{yyyyMMdd-HHmmss}.json   (individual | batch)
 *   abad-athenea-{type}-{yyyyMMdd-HHmmss}.xlsx   (excel)
 *   abad-athenea-manifest-{yyyyMMdd-HHmmss}.json
 */
export type ExportType = "individual" | "batch" | "excel";

const EXTENSION: Record<ExportType, "json" | "xlsx"> = {
  individual: "json",
  batch: "json",
  excel: "xlsx",
};

export function exportFilename(type: ExportType, date: Date): string {
  return `abad-athenea-${type}-${formatTimestamp(date)}.${EXTENSION[type]}`;
}

export function manifestFilename(date: Date): string {
  return `abad-athenea-manifest-${formatTimestamp(date)}.json`;
}
