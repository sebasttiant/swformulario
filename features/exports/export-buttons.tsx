"use client";

import { useState, type ElementType } from "react";
import { Download, FileJson, FileSpreadsheet, Loader2 } from "lucide-react";
import { exportPatients } from "./export-actions";
import type { ExportType } from "./filename";
import { downloadBase64 } from "@/lib/utils/download";
import { Button } from "@/components/ui/button";

interface ExportButtonsProps {
  patientIds: string[];
  /** Which export buttons to show. */
  show?: ExportType[];
  /** Also download the manifest alongside the file. Default true. */
  withManifest?: boolean;
  disabled?: boolean;
}

const LABELS: Record<ExportType, { label: string; icon: ElementType }> = {
  individual: { label: "JSON individual", icon: FileJson },
  batch: { label: "JSON lote", icon: FileJson },
  excel: { label: "Excel (.xlsx)", icon: FileSpreadsheet },
};

export function ExportButtons({
  patientIds,
  show = ["individual", "batch", "excel"],
  withManifest = true,
  disabled,
}: ExportButtonsProps) {
  const [busy, setBusy] = useState<ExportType | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(type: ExportType) {
    setBusy(type);
    setMessage(null);
    setError(null);
    try {
      const result = await exportPatients(type, patientIds);
      if (!result.ok || !result.contentBase64 || !result.filename) {
        setError(result.error ?? "No se pudo generar la exportación.");
        return;
      }
      downloadBase64(result.contentBase64, result.filename, result.mimeType!);
      if (withManifest && result.manifestBase64 && result.manifestFilename) {
        downloadBase64(
          result.manifestBase64,
          result.manifestFilename,
          "application/json",
        );
      }
      setMessage(
        `Generado ${result.filename} (${result.manifest?.patientCount ?? 0} paciente(s)).`,
      );
    } catch (err) {
      console.error(err);
      setError("Error inesperado al exportar.");
    } finally {
      setBusy(null);
    }
  }

  const noSelection = patientIds.length === 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {show.map((type) => {
          const { label, icon: Icon } = LABELS[type];
          const isIndividual = type === "individual";
          const blocked =
            disabled ||
            (isIndividual ? patientIds.length !== 1 : noSelection) ||
            busy !== null;
          return (
            <Button
              key={type}
              type="button"
              variant={type === "excel" ? "secondary" : "default"}
              onClick={() => run(type)}
              disabled={blocked}
            >
              {busy === type ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Icon className="size-4" />
              )}
              {label}
            </Button>
          );
        })}
      </div>
      {message ? (
        <p className="flex items-center gap-1.5 text-sm text-success">
          <Download className="size-4" /> {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
