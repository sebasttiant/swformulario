import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PatientWizard } from "@/features/patients/patient-wizard";
import { getCatalogOptions } from "@/features/catalogs/catalog-data";
import { getPatient } from "@/features/patients/patient-data";
import { patientToFormValues } from "@/features/patients/patient-form-mapper";
import { requireAdmin } from "@/lib/auth/session";

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [patient, options] = await Promise.all([
    getPatient(id),
    getCatalogOptions(),
  ]);
  if (!patient) notFound();

  return (
    <AppShell variant="patient">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Editar paciente
          </h1>
          <p className="text-ink-soft">
            {patient.firstName} {patient.firstSurname} · {patient.documentNumber}
          </p>
        </div>
        <PatientWizard
          options={options}
          patientId={patient.id}
          initialValues={patientToFormValues(patient)}
        />
      </div>
    </AppShell>
  );
}
