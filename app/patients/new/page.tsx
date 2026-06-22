import { AppShell } from "@/components/layout/app-shell";
import { PatientWizard } from "@/features/patients/patient-wizard";
import { getCatalogOptions } from "@/features/catalogs/catalog-data";
import { requireAdmin } from "@/lib/auth/session";

export default async function NewPatientPage() {
  await requireAdmin();
  const options = await getCatalogOptions();

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Registrar paciente
          </h1>
          <p className="text-ink-soft">
            Completa el asistente. Los datos se validan antes de guardar.
          </p>
        </div>
        <PatientWizard options={options} />
      </div>
    </AppShell>
  );
}
