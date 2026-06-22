"use client";

import * as React from "react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ExportButtons } from "@/features/exports/export-buttons";
import type { ExportType } from "@/features/exports/filename";
import type { PatientListItem } from "./patient-data";

interface PatientListProps {
  items: PatientListItem[];
  showExport?: boolean;
  exportTypes?: ExportType[];
}

export function PatientList({
  items,
  showExport = false,
  exportTypes = ["batch", "excel"],
}: PatientListProps) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const allSelected = items.length > 0 && selected.size === items.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(items.map((i) => i.id)));
  }

  const selectedIds = Array.from(selected);

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-canvas p-8 text-center text-sm text-muted">
        No hay pacientes que coincidan.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-canvas text-left text-xs uppercase tracking-wide text-muted">
              {showExport ? (
                <th className="w-10 px-4 py-3">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Seleccionar todos"
                  />
                </th>
              ) : null}
              <th className="px-4 py-3">Documento</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0">
                {showExport ? (
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selected.has(item.id)}
                      onCheckedChange={() => toggle(item.id)}
                      aria-label={`Seleccionar ${item.fullName}`}
                    />
                  </td>
                ) : null}
                <td className="px-4 py-3 font-medium text-ink">
                  {item.documentNumber}
                </td>
                <td className="px-4 py-3 text-ink-soft">{item.fullName}</td>
                <td className="px-4 py-3">
                  <Badge variant={item.status === "READY" ? "success" : "neutral"}>
                    {item.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/patients/${item.id}`}
                    className="font-medium text-brand hover:underline"
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showExport ? (
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="mb-1 text-sm font-medium text-ink">
            {selectedIds.length} paciente(s) seleccionado(s)
          </p>
          <p className="mb-3 text-sm text-muted">
            {selectedIds.length === 0
              ? "Seleccione uno o más pacientes para exportar (use la casilla del encabezado para seleccionar todos)."
              : "Genere el JSON por lote o el Excel; se descargará también el manifiesto."}
          </p>
          <ExportButtons patientIds={selectedIds} show={exportTypes} />
        </div>
      ) : null}
    </div>
  );
}
