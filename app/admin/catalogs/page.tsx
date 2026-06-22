import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Banner } from "@/components/ui/banner";
import { CatalogEditor } from "@/features/catalogs/catalog-editor";
import { getCatalogsWithValues } from "@/features/catalogs/catalog-data";
import { requireAdmin } from "@/lib/auth/session";

export default async function CatalogsPage() {
  await requireAdmin();
  const catalogs = await getCatalogsWithValues();

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <Link
            href="/admin"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
          >
            <ChevronLeft className="size-4" /> Administración
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Catálogos
          </h1>
          <p className="text-ink-soft">
            Cada valor lleva su <strong>ID de Athenea</strong>. Edítalos cuando
            tengas los IDs reales.
          </p>
        </div>

        <Banner variant="info" title="IDs de Athenea editables">
          Los IDs sembrados son <strong>placeholder</strong>. El export usa
          exactamente el valor de esta columna (<code>atheneaValue</code>), nunca
          un ID hardcodeado.
        </Banner>

        <CatalogEditor catalogs={catalogs} />
      </div>
    </AppShell>
  );
}
