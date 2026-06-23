import { FileSpreadsheet, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientList } from "@/features/patients/patient-list";
import { getPatients } from "@/features/patients/patient-data";
import { hasPlaceholderMappings } from "@/features/catalogs/catalog-data";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";

export default async function ExportsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;
  const [patients, placeholders, batches] = await Promise.all([
    getPatients(q),
    hasPlaceholderMappings(),
    prisma.exportBatch.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-ink p-6 text-white shadow-premium sm:p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-brand/25" />
          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white/75">
              <ShieldCheck className="size-3.5 text-brand" /> Área administrativa
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Exportar a Athenea
            </h1>
            <p className="mt-2 text-base leading-7 text-white/70">
              Selecciona pacientes y genera el JSON (formato <code>InsPaciente</code>)
              o el Excel. Cada exportación descarga también su manifiesto de
              auditoría.
            </p>
          </div>
        </div>

        {placeholders ? (
          <Banner variant="warning" title="Configuración con placeholders">
            Las exportaciones incluirán una advertencia en el manifiesto hasta que
            confirmes el mapeo y los IDs de catálogo.
          </Banner>
        ) : null}

        <form className="flex gap-2 rounded-2xl border border-white/70 bg-surface/90 p-3 shadow-soft" action="/exports">
          <Input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por documento o nombre…"
            aria-label="Buscar pacientes"
            className="flex-1"
          />
          <Button type="submit" variant="outline">
            Buscar
          </Button>
        </form>

        <PatientList items={patients} showExport exportTypes={["batch", "excel"]} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="size-4" /> Exportaciones recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {batches.length === 0 ? (
              <p className="text-sm text-muted">Aún no hay exportaciones.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border text-sm">
                {batches.map((b) => (
                  <li
                    key={b.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2"
                  >
                    <span className="font-mono text-ink">{b.filename}</span>
                    <span className="text-muted">
                      {b.patientCount} paciente(s) · v{b.mappingVersion} ·{" "}
                      {b.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
