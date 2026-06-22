import Link from "next/link";
import { UserPlus, Users, FileSpreadsheet, Settings2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/session";
import { getPatientCount } from "@/features/patients/patient-data";
import { hasPlaceholderMappings } from "@/features/catalogs/catalog-data";

export default async function HomePage() {
  await requireAdmin();
  const [patientCount, placeholders] = await Promise.all([
    getPatientCount(),
    hasPlaceholderMappings(),
  ]);

  const actions = [
    {
      href: "/patients/new",
      title: "Registrar paciente",
      description: "Asistente paso a paso con validación.",
      icon: UserPlus,
    },
    {
      href: "/admin",
      title: "Pacientes y catálogos",
      description: "Buscar, editar y administrar.",
      icon: Users,
    },
    {
      href: "/exports",
      title: "Exportar a Athenea",
      description: "JSON individual / lote y Excel.",
      icon: FileSpreadsheet,
    },
    {
      href: "/admin/mapping",
      title: "Mapeo D0-D9",
      description: "Configurar dimensiones de exportación.",
      icon: Settings2,
    },
  ];

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            Panel interno
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            Registro de pacientes ABAD
          </h1>
          <p className="max-w-2xl text-ink-soft">
            Captura los datos demográficos del paciente y genera los archivos de
            importación para Athenea. Reemplaza la digitación manual.
          </p>
        </section>

        {placeholders ? (
          <Banner
            variant="warning"
            title="Configuración con valores de ejemplo"
          >
            El mapeo D0-D9 y los IDs de catálogo están sembrados como{" "}
            <strong>placeholder</strong>. Confírmalos en{" "}
            <Link href="/admin/mapping" className="font-medium underline">
              Mapeo
            </Link>{" "}
            antes de importar a Athenea.
          </Banner>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardDescription>Pacientes registrados</CardDescription>
              <CardTitle className="text-4xl">{patientCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <Link href="/patients/new">
                  <UserPlus className="size-4" /> Nuevo paciente
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Integración Athenea</CardDescription>
              <CardTitle className="text-xl">Modo exportación</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-ink-soft">
              El envío directo por API está deshabilitado (falta el documento de
              autenticación JWT). Por ahora se exportan archivos JSON/Excel.
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((action) => (
            <Link key={action.href} href={action.href} className="group">
              <Card className="h-full transition-shadow group-hover:shadow-md">
                <CardContent className="flex flex-col gap-3 p-5">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
                    <action.icon className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{action.title}</p>
                    <p className="text-sm text-muted">{action.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
