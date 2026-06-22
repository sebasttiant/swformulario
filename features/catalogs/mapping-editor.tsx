"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, CheckCircle2 } from "lucide-react";
import { updateMapping } from "./catalog-actions";
import { CATALOG_KEYS } from "./catalog-schema";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MappingRow {
  id: string;
  dimensionKey: string;
  sourceField: string;
  catalogKey: string | null;
  exportKey: string;
  active: boolean;
  version: number;
}

const NONE = "__none__";

// Patient fields available as a mapping source. Catalog fields resolve to their
// Athenea value; raw fields export verbatim.
const SOURCE_FIELDS: Array<{ value: string; label: string }> = [
  { value: NONE, label: "(vacío)" },
  { value: "residentialZoneCatalogValueId", label: "Zona residencial (catálogo)" },
  { value: "userTypeCatalogValueId", label: "Tipo de usuario (catálogo)" },
  { value: "nationalityCatalogValueId", label: "Nacionalidad (catálogo)" },
  { value: "insurerCatalogValueId", label: "Aseguradora (catálogo)" },
  { value: "patientOriginCatalogValueId", label: "Origen paciente (catálogo)" },
  { value: "treatmentCatalogValueId", label: "Tratamiento (catálogo)" },
  { value: "cityCatalogValueId", label: "Ciudad (catálogo)" },
  { value: "documentExpeditionCityCatalogValueId", label: "Ciudad expedición (catálogo)" },
  { value: "entityCatalogValueId", label: "Entidad (catálogo)" },
  { value: "planCatalogValueId", label: "Plan (catálogo)" },
  { value: "address", label: "Dirección (texto)" },
  { value: "mobilePhone", label: "Teléfono móvil (texto)" },
  { value: "fixedPhone", label: "Teléfono fijo (texto)" },
  { value: "email", label: "Correo (texto)" },
];

export function MappingEditor({ mappings }: { mappings: MappingRow[] }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-4 sm:p-6">
        <div className="hidden gap-2 px-1 text-xs font-medium uppercase text-muted sm:grid sm:grid-cols-[80px_1fr_1fr_auto_auto] sm:items-center">
          <span>Dimensión</span>
          <span>Campo origen</span>
          <span>Catálogo</span>
          <span>Activo</span>
          <span />
        </div>
        {mappings.map((mapping) => (
          <MappingRowEditor key={mapping.id} initial={mapping} />
        ))}
      </CardContent>
    </Card>
  );
}

function MappingRowEditor({ initial }: { initial: MappingRow }) {
  const router = useRouter();
  const [sourceField, setSourceField] = React.useState(
    initial.sourceField || NONE,
  );
  const [catalogKey, setCatalogKey] = React.useState(initial.catalogKey ?? NONE);
  const [active, setActive] = React.useState(initial.active);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const confirmed = initial.version >= 2;

  async function save() {
    setBusy(true);
    setError(null);
    const result = await updateMapping({
      dimensionKey: initial.dimensionKey,
      sourceField: sourceField === NONE ? "" : sourceField,
      catalogKey: catalogKey === NONE ? null : catalogKey,
      exportKey: initial.exportKey,
      active,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-2 sm:grid sm:grid-cols-[80px_1fr_1fr_auto_auto] sm:items-center sm:border-0 sm:p-0">
      <div className="flex items-center gap-1.5 font-mono text-sm font-semibold text-ink">
        {initial.dimensionKey}
        {confirmed ? (
          <CheckCircle2 className="size-3.5 text-success" aria-label="Confirmado" />
        ) : null}
      </div>

      <Select value={sourceField} onValueChange={setSourceField}>
        <SelectTrigger aria-label={`Campo origen ${initial.dimensionKey}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SOURCE_FIELDS.map((f) => (
            <SelectItem key={f.value} value={f.value}>
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={catalogKey} onValueChange={setCatalogKey}>
        <SelectTrigger aria-label={`Catálogo ${initial.dimensionKey}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>(campo directo)</SelectItem>
          {CATALOG_KEYS.map((key) => (
            <SelectItem key={key} value={key}>
              {key}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center justify-center px-2">
        <Checkbox
          checked={active}
          onCheckedChange={(c) => setActive(c === true)}
          aria-label={`Activo ${initial.dimensionKey}`}
        />
      </div>

      <Button type="button" size="sm" variant="outline" onClick={save} disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
      </Button>

      {error ? (
        <p className="text-xs text-danger sm:col-span-5" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
