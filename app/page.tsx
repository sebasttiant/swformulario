import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileSpreadsheet,
  LockKeyhole,
  Settings2,
  UserPlus,
  Users,
} from "lucide-react";
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
      description: "Flujo guiado para captura rápida y validada.",
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
      <div className="flex flex-col gap-6 lg:gap-8">
        <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-surface/95 shadow-premium ring-1 ring-border/60">
          <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-brand/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
          <div className="grid gap-0 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="relative flex flex-col gap-7 p-6 sm:p-8 lg:p-10">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-strong">
                  Panel interno
                </span>
                <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-ink-soft">
                  Exportación Athenea administrada
                </span>
              </div>

              <div className="max-w-3xl space-y-4">
                <h1 className="text-4xl font-black tracking-tight text-ink sm:text-5xl lg:text-6xl">
                  Registro de pacientes ABAD
                </h1>
                <p className="text-base leading-7 text-ink-soft sm:text-lg">
                  Captura datos demográficos, valida el flujo por pasos y genera
                  archivos JSON/Excel compatibles con Athenea desde una consola
                  interna, sin exponer herramientas de exportación al flujo final.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/80 bg-surface-raised p-4 shadow-soft">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">Captura</p>
                  <p className="mt-1 text-sm font-semibold text-ink">Asistente validado</p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-surface-raised p-4 shadow-soft">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">Datos</p>
                  <p className="mt-1 text-sm font-semibold text-ink">PostgreSQL persistente</p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-surface-raised p-4 shadow-soft">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">Athenea</p>
                  <p className="mt-1 text-sm font-semibold text-ink">Salida admin</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/patients/new">
                    Registrar paciente <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  <Link href="/exports">Ver exportaciones</Link>
                </Button>
              </div>
            </div>

            <div className="relative bg-ink p-6 text-white sm:p-8 lg:p-10">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-brand/20" />
              <div className="relative flex h-full flex-col justify-between gap-8 rounded-2xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white/55">
                    <BarChart3 className="size-4 text-brand" /> Estado demo
                  </p>
                  <p className="mt-3 text-5xl font-black">{patientCount}</p>
                  <p className="mt-1 text-sm text-white/65">
                    pacientes registrados
                  </p>
                </div>
                <ul className="space-y-3 text-sm text-white/80">
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 text-brand" />
                    Formulario por pasos, usable en tablet y escritorio.
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 text-brand" />
                    Persistencia en PostgreSQL vía Docker Compose.
                  </li>
                  <li className="flex gap-2">
                    <LockKeyhole className="mt-0.5 size-4 text-brand" />
                    Exportación visible solo en área administrativa.
                  </li>
                </ul>
              </div>
            </div>
          </div>
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

        <section className="grid gap-4 md:grid-cols-2">
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

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {actions.map((action) => (
            <Link key={action.href} href={action.href} className="group">
              <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg">
                <CardContent className="flex min-h-44 flex-col justify-between gap-5 p-6">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                    <action.icon className="size-5" />
                  </span>
                  <div>
                    <p className="text-lg font-bold text-ink">{action.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted">
                      {action.description}
                    </p>
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
