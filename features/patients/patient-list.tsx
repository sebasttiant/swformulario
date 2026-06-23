"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { ExportButtons } from "@/features/exports/export-buttons";
import type { ExportType } from "@/features/exports/filename";
import { cn } from "@/lib/utils/cn";
import type { PatientListItem } from "./patient-data";

interface PatientListProps {
  items: PatientListItem[];
  showExport?: boolean;
  exportTypes?: ExportType[];
}

/** Two-letter initials from the first and last name parts. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function StatusBadge({ status }: { status: string }) {
  const ready = status === "READY";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        ready
          ? "bg-success-soft text-success"
          : "bg-warning-soft text-warning",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          ready ? "bg-success" : "bg-warning",
        )}
        aria-hidden
      />
      {ready ? "Listo" : status}
    </span>
  );
}

export function PatientList({
  items,
  showExport = false,
  exportTypes = ["batch", "excel"],
}: PatientListProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

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
      <EmptyState
        icon={Users}
        title="Sin pacientes"
        description="No hay pacientes que coincidan con la búsqueda. Registra un paciente para verlo en esta lista."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-2xl border border-white/70 bg-surface/95 shadow-soft ring-1 ring-border/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-raised text-left text-[0.7rem] font-semibold uppercase tracking-wider text-muted">
              {showExport ? (
                <th className="w-10 px-4 py-3.5">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Seleccionar todos"
                  />
                </th>
              ) : null}
              <th className="px-4 py-3.5">Paciente</th>
              <th className="hidden px-4 py-3.5 sm:table-cell">Documento</th>
              <th className="px-4 py-3.5">Estado</th>
              <th className="px-4 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isSelected = selected.has(item.id);
              return (
                <tr
                  key={item.id}
                  className={cn(
                    "border-b border-border/70 transition-colors last:border-0 hover:bg-brand-faint focus-within:bg-brand-faint",
                    isSelected && "bg-brand-soft/60",
                  )}
                >
                  {showExport ? (
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggle(item.id)}
                        aria-label={`Seleccionar ${item.fullName}`}
                      />
                    </td>
                  ) : null}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-strong ring-1 ring-brand/10"
                        aria-hidden
                      >
                        {initials(item.fullName)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">
                          {item.fullName}
                        </p>
                        <p className="text-xs text-muted sm:hidden">
                          {item.documentNumber}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 font-medium text-ink-soft sm:table-cell">
                    {item.documentNumber}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/patients/${item.id}`}
                      aria-label={`Ver ${item.fullName}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-ink shadow-sm transition-all hover:border-brand/40 hover:bg-brand-faint hover:text-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      Ver
                      <ChevronRight className="size-3.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showExport ? (
        <div className="rounded-2xl border border-white/70 bg-surface/95 p-4 shadow-soft ring-1 ring-border/60">
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
