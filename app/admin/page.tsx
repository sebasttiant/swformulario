import Link from "next/link";
import { Search, ListChecks, Settings2, UserPlus } from "lucide-react";
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
  await requireAdmin();
  const { q } = await searchParams;
  const [patients, placeholders] = await Promise.all([
    getPatients(q),
    hasPlaceholderMappings(),
  ]);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Administración
            </h1>
            <p className="text-ink-soft">Pacientes, catálogos y mapeo Athenea.</p>
          </div>
          <Button asChild>
            <Link href="/patients/new">
              <UserPlus className="size-4" /> Nuevo paciente
            </Link>
          </Button>
        </div>

        {placeholders ? (
          <Banner variant="warning" title="Mapeo / catálogos en placeholder">
            Confirma el mapeo D0-D9 y los IDs de catálogo antes de exportar a
            Athenea.
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

        <form className="flex gap-2" action="/admin">
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
