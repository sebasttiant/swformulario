import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Database, Pencil, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <AppShell variant="patient">
      <div className="flex flex-col gap-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-surface/95 p-6 shadow-premium ring-1 ring-border/60 sm:p-8">
          <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-success/10 blur-3xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <Badge variant="success" className="mb-3">
              <CheckCircle2 className="size-3.5" /> Registro guardado
            </Badge>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">
                {fullName}
              </h1>
              <Badge variant={patient.status === "READY" ? "success" : "neutral"}>
                {patient.status}
              </Badge>
            </div>
            <p className="mt-2 text-ink-soft">Documento: {patient.documentNumber}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-surface-raised p-4 shadow-soft">
                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Database className="size-4 text-success" /> Datos persistidos
                </p>
                <p className="mt-1 text-sm text-muted">La información quedó disponible para gestión interna.</p>
              </div>
              <div className="rounded-2xl border border-border bg-surface-raised p-4 shadow-soft">
                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <ShieldCheck className="size-4 text-brand" /> Gestión restringida
                </p>
                <p className="mt-1 text-sm text-muted">Los procesos administrativos se gestionan fuera del flujo del paciente.</p>
              </div>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href={`/patients/${patient.id}/edit`}>
              <Pencil className="size-4" /> Editar
            </Link>
          </Button>
          </div>
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
      </div>
    </AppShell>
  );
}
