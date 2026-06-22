"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { catalogValueSchema, type CatalogValueInput } from "./catalog-schema";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function upsertCatalogValue(
  catalogId: string,
  input: CatalogValueInput,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = catalogValueSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos del valor inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const data = parsed.data;

  try {
    if (data.id) {
      await prisma.catalogValue.update({
        where: { id: data.id },
        data: {
          code: data.code,
          label: data.label,
          atheneaValue: data.atheneaValue,
          active: data.active,
          sortOrder: data.sortOrder,
        },
      });
    } else {
      await prisma.catalogValue.create({
        data: {
          catalogId,
          code: data.code,
          label: data.label,
          atheneaValue: data.atheneaValue,
          active: data.active,
          sortOrder: data.sortOrder,
        },
      });
    }
    revalidatePath("/admin/catalogs");
    return { ok: true };
  } catch (error) {
    console.error("upsertCatalogValue failed", error);
    return { ok: false, error: "No se pudo guardar el valor (¿código duplicado?)." };
  }
}

export async function deleteCatalogValue(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await prisma.catalogValue.delete({ where: { id } });
    revalidatePath("/admin/catalogs");
    return { ok: true };
  } catch (error) {
    console.error("deleteCatalogValue failed", error);
    return { ok: false, error: "No se pudo eliminar el valor." };
  }
}

export interface MappingInput {
  dimensionKey: string;
  sourceField: string;
  catalogKey: string | null;
  exportKey: string;
  active: boolean;
}

/** Update a D0-D9 / variable-dimension mapping. Saving marks it as confirmed
 * (version >= 2), which clears the placeholder warning for that dimension. */
export async function updateMapping(input: MappingInput): Promise<ActionResult> {
  await requireAdmin();
  try {
    await prisma.dimensionMapping.update({
      where: { dimensionKey: input.dimensionKey },
      data: {
        sourceField: input.sourceField,
        catalogKey: input.catalogKey || null,
        exportKey: input.exportKey,
        active: input.active,
        version: { set: 2 },
      },
    });
    revalidatePath("/admin/mapping");
    revalidatePath("/exports");
    return { ok: true };
  } catch (error) {
    console.error("updateMapping failed", error);
    return { ok: false, error: "No se pudo actualizar el mapeo." };
  }
}
