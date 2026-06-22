"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2, Loader2 } from "lucide-react";
import {
  upsertCatalogValue,
  deleteCatalogValue,
} from "./catalog-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface CatalogValueRow {
  id: string;
  code: string;
  label: string;
  atheneaValue: string;
  active: boolean;
  sortOrder: number;
}

interface CatalogData {
  id: string;
  key: string;
  label: string;
  description: string | null;
  values: CatalogValueRow[];
}

export function CatalogEditor({ catalogs }: { catalogs: CatalogData[] }) {
  return (
    <div className="flex flex-col gap-6">
      {catalogs.map((catalog) => (
        <Card key={catalog.id}>
          <CardHeader>
            <CardTitle className="text-base">
              {catalog.label}{" "}
              <span className="font-mono text-xs text-muted">
                ({catalog.key})
              </span>
            </CardTitle>
            {catalog.description ? (
              <CardDescription>{catalog.description}</CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="hidden gap-2 px-1 text-xs font-medium uppercase text-muted sm:grid sm:grid-cols-[1fr_1.5fr_1fr_auto_auto]">
              <span>Código</span>
              <span>Etiqueta</span>
              <span>ID Athenea</span>
              <span>Activo</span>
              <span />
            </div>
            {catalog.values.map((value) => (
              <ValueRow
                key={value.id}
                catalogId={catalog.id}
                initial={value}
              />
            ))}
            <ValueRow catalogId={catalog.id} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ValueRow({
  catalogId,
  initial,
}: {
  catalogId: string;
  initial?: CatalogValueRow;
}) {
  const router = useRouter();
  const isNew = !initial;
  const [code, setCode] = React.useState(initial?.code ?? "");
  const [label, setLabel] = React.useState(initial?.label ?? "");
  const [atheneaValue, setAtheneaValue] = React.useState(
    initial?.atheneaValue ?? "",
  );
  const [active, setActive] = React.useState(initial?.active ?? true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    const result = await upsertCatalogValue(catalogId, {
      id: initial?.id,
      code,
      label,
      atheneaValue,
      active,
      sortOrder: initial?.sortOrder ?? 0,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (isNew) {
      setCode("");
      setLabel("");
      setAtheneaValue("");
      setActive(true);
    }
    router.refresh();
  }

  async function remove() {
    if (!initial) return;
    setBusy(true);
    const result = await deleteCatalogValue(initial.id);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-2 sm:grid sm:grid-cols-[1fr_1.5fr_1fr_auto_auto] sm:items-center sm:border-0 sm:p-0">
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Código"
        aria-label="Código"
      />
      <Input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Etiqueta"
        aria-label="Etiqueta"
      />
      <Input
        value={atheneaValue}
        onChange={(e) => setAtheneaValue(e.target.value)}
        placeholder="ID Athenea"
        aria-label="ID Athenea"
        className="font-mono"
      />
      <div className="flex items-center justify-center px-2">
        <Checkbox
          checked={active}
          onCheckedChange={(c) => setActive(c === true)}
          aria-label="Activo"
        />
      </div>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="sm"
          variant={isNew ? "default" : "outline"}
          onClick={save}
          disabled={busy || !code || !label}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isNew ? (
            <Plus className="size-4" />
          ) : (
            <Save className="size-4" />
          )}
        </Button>
        {!isNew ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={remove}
            disabled={busy}
            aria-label="Eliminar"
          >
            <Trash2 className="size-4 text-danger" />
          </Button>
        ) : null}
      </div>
      {error ? (
        <p className="text-xs text-danger sm:col-span-5" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
