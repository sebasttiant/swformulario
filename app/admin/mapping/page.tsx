import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Banner } from "@/components/ui/banner";
import { MappingEditor } from "@/features/catalogs/mapping-editor";
import { getDimensionMappings } from "@/features/catalogs/catalog-data";
import { requireAdmin } from "@/lib/auth/session";

export default async function MappingPage() {
  const me = await requireAdmin();
  const mappings = await getDimensionMappings();

  return (
    <AppShell role={me.role}>
      <div className="flex flex-col gap-6">
        <div>
          <Link
            href="/admin"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
          >
            <ChevronLeft className="size-4" /> Administración
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Mapeo de dimensiones D0-D9
          </h1>
          <p className="text-ink-soft">
            Define qué campo del paciente alimenta cada dimensión Athenea
            (D0-D9, ENTIDAD, PLAN).
          </p>
        </div>

        <Banner variant="warning" title="Mapeo no confirmado oficialmente">
          El mapeo exacto de dimensiones <strong>no está documentado</strong> por
          Athenea. Los valores actuales son una propuesta inicial por defecto. Al
          guardar una dimensión se marca como confirmada y deja de generar
          advertencia.
        </Banner>

        <MappingEditor mappings={mappings} />
      </div>
    </AppShell>
  );
}
