import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportButtons } from "@/features/exports/export-buttons";
import { getPatient } from "@/features/patients/patient-data";
import {
  getCatalogOptions,
  type CatalogOptions,
  type CatalogOption,
} from "@/features/catalogs/catalog-data";
import { requireAdmin } from "@/lib/auth/session";

function labelFor(list: CatalogOption[], id?: string | null): string {
  if (!id) return "—";
  return list.find((o) => o.id === id)?.label ?? "—";
}

export default async function PatientDetailPage({
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

  const o: CatalogOptions = options;
  const fullName = [
    patient.firstName,
    patient.secondName,
    patient.firstSurname,
    patient.secondSurname,
  ]
    .filter(Boolean)
    .join(" ");

  const sections: Array<{ title: string; rows: Array<[string, string]> }> = [
    {
      title: "Identificación",
      rows: [
        ["Tipo de documento", labelFor(o.documentType, patient.documentTypeId)],
        ["Número", patient.documentNumber],
        ["Nombre completo", fullName],
        ["Fecha de nacimiento", patient.birthDate.toISOString().slice(0, 10)],
        ["Sexo", labelFor(o.sex, patient.sexCatalogValueId)],
        ["Activo", patient.active ? "Sí" : "No"],
      ],
    },
    {
      title: "Contacto",
      rows: [
        ["Teléfono fijo", patient.fixedPhone ?? "—"],
        ["Teléfono móvil", patient.mobilePhone ?? "—"],
        ["Correo", patient.noEmail ? "Sin correo" : patient.email ?? "—"],
      ],
    },
    {
      title: "Ubicación",
      rows: [
        ["Dirección", patient.address ?? "—"],
        ["Ciudad", labelFor(o.city, patient.cityCatalogValueId)],
        ["Zona residencial", labelFor(o.residentialZone, patient.residentialZoneCatalogValueId)],
        ["Nacionalidad", labelFor(o.nationality, patient.nationalityCatalogValueId)],
      ],
    },
    {
      title: "Administrativo",
      rows: [
        ["Tipo de usuario", labelFor(o.userType, patient.userTypeCatalogValueId)],
        ["Aseguradora", labelFor(o.insurer, patient.insurerCatalogValueId)],
        ["Origen", labelFor(o.patientOrigin, patient.patientOriginCatalogValueId)],
        ["Tratamiento", labelFor(o.treatment, patient.treatmentCatalogValueId)],
        ["Ciudad expedición", labelFor(o.documentExpeditionCity, patient.documentExpeditionCityCatalogValueId)],
        ["Entidad", labelFor(o.entity, patient.entityCatalogValueId)],
        ["Plan", labelFor(o.plan, patient.planCatalogValueId)],
      ],
    },
  ];

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-ink">
                {fullName}
              </h1>
              <Badge variant={patient.status === "READY" ? "success" : "neutral"}>
                {patient.status}
              </Badge>
            </div>
            <p className="text-ink-soft">Documento: {patient.documentNumber}</p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/patients/${patient.id}/edit`}>
              <Pencil className="size-4" /> Editar
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {sections.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle className="text-base">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-y-2">
                  {section.rows.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3 text-sm">
                      <dt className="text-muted">{k}</dt>
                      <dd className="text-right font-medium text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Exportar a Athenea</CardTitle>
          </CardHeader>
          <CardContent>
            <ExportButtons
              patientIds={[patient.id]}
              show={["individual", "excel"]}
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
