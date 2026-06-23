import Link from "next/link";
import { Search, ListChecks, Settings2, UserPlus, UsersRound } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Banner } from "@/components/ui/banner";
import { PatientList } from "@/features/patients/patient-list";
import { getPatients } from "@/features/patients/patient-data";
import { hasPlaceholderMappings } from "@/features/catalogs/catalog-data";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const me = await requireAdmin();
  const { q } = await searchParams;
  const [patients, placeholders] = await Promise.all([
    getPatients(q),
    hasPlaceholderMappings(),
  ]);

  return (
    <AppShell role={me.role}>
      <div className="flex flex-col gap-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-surface/95 p-6 shadow-premium ring-1 ring-border/60 sm:p-8">
          <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-brand/10 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-strong">
              <UsersRound className="size-3.5" /> Operación interna
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-ink sm:text-4xl">
              Administración
            </h1>
            <p className="mt-2 text-ink-soft">Pacientes, catálogos y mapeo Athenea.</p>
          </div>
          <Button asChild>
            <Link href="/patients/new">
              <UserPlus className="size-4" /> Nuevo paciente
            </Link>
          </Button>
          </div>
        </div>

        {placeholders ? (
          <Banner variant="warning" title="Configuración pendiente">
            Confirma las equivalencias y los catálogos de exportación antes de
            enviar a Athenea.
          </Banner>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/admin/catalogs" className="group">
            <Card className="transition-shadow group-hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-5">
                <span className="flex size-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <ListChecks className="size-5" />
                </span>
                <div>
                  <p className="font-semibold text-ink">Catálogos</p>
                  <p className="text-sm text-muted">
                    Valores y sus IDs de Athenea.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/mapping" className="group">
            <Card className="transition-shadow group-hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-5">
                <span className="flex size-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <Settings2 className="size-5" />
                </span>
                <div>
                  <p className="font-semibold text-ink">Mapeo D0-D9</p>
                  <p className="text-sm text-muted">
                    Dimensiones y dimensiones variables.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <form className="flex gap-2 rounded-2xl border border-white/70 bg-surface/90 p-3 shadow-soft" action="/admin">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Buscar por documento o nombre…"
              className="pl-9"
              aria-label="Buscar pacientes"
            />
          </div>
          <Button type="submit" variant="outline">
            Buscar
          </Button>
        </form>

        <PatientList items={patients} />
      </div>
    </AppShell>
  );
}
