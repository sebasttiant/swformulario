import { prisma } from "@/lib/db/prisma";
import { CATALOG_KEYS, type CatalogKey } from "./catalog-schema";

export interface CatalogOption {
  id: string;
  code: string;
  label: string;
  atheneaValue: string;
}

export type CatalogOptions = Record<CatalogKey, CatalogOption[]>;

/** Active values per catalog, shaped for wizard <Select> inputs. */
export async function getCatalogOptions(): Promise<CatalogOptions> {
  const catalogs = await prisma.catalog.findMany({
    include: {
      values: {
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      },
    },
  });

  const result = Object.fromEntries(
    CATALOG_KEYS.map((key) => [key, [] as CatalogOption[]]),
  ) as CatalogOptions;

  for (const catalog of catalogs) {
    if ((CATALOG_KEYS as readonly string[]).includes(catalog.key)) {
      result[catalog.key as CatalogKey] = catalog.values.map((v) => ({
        id: v.id,
        code: v.code,
        label: v.label,
        atheneaValue: v.atheneaValue,
      }));
    }
  }
  return result;
}

/** Full catalogs with all values (active + inactive) for the admin editor. */
export async function getCatalogsWithValues() {
  return prisma.catalog.findMany({
    orderBy: { label: "asc" },
    include: {
      values: { orderBy: [{ sortOrder: "asc" }, { label: "asc" }] },
    },
  });
}

export async function getDimensionMappings() {
  return prisma.dimensionMapping.findMany({ orderBy: { dimensionKey: "asc" } });
}

/** Current mapping version = highest version among active mappings (min 1). */
export async function getMappingVersion(): Promise<number> {
  const mappings = await prisma.dimensionMapping.findMany();
  return mappings.reduce((max, m) => Math.max(max, m.version), 1);
}

/**
 * Whether the current export config still relies on seeded placeholders.
 * MVP heuristic: any active mapping still at the seeded version 1 means the
 * D0-D9 mapping has not been reviewed/confirmed against Athenea yet.
 */
export async function hasPlaceholderMappings(): Promise<boolean> {
  const count = await prisma.dimensionMapping.count({
    where: { active: true, version: 1 },
  });
  return count > 0;
}
