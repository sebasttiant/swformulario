import { AppShell } from "@/components/layout/app-shell";
import { PatientWizard } from "@/features/patients/patient-wizard";
import { getCatalogOptions } from "@/features/catalogs/catalog-data";
import { requireAdmin } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";

export default async function NewPatientPage() {
  await requireAdmin();
  const options = await getCatalogOptions();

  return (
    <AppShell variant="patient">
      <div className="flex flex-col gap-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-surface/95 p-6 shadow-premium ring-1 ring-border/60 sm:p-8">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-brand/10 blur-3xl" />
          <div className="relative max-w-3xl">
            <Badge>Flujo guiado</Badge>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-ink sm:text-4xl">
              Registrar paciente
            </h1>
            <p className="mt-2 text-base leading-7 text-ink-soft">
              Completa el asistente con validación por etapas. Al guardar, los datos quedan persistidos y la confirmación mantiene fuera de vista las herramientas administrativas.
            </p>
          </div>
        </div>
        <PatientWizard options={options} />
      </div>
    </AppShell>
  );
}
