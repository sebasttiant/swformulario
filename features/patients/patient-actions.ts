"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import {
  patientSchema,
  type PatientFormValues,
  type PatientParsed,
} from "./patient-schema";
import { validateCatalogRefs } from "@/features/catalogs/validate-refs";

export type PatientActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/** Map validated form values into the Prisma persistence shape. */
function toPatientData(parsed: PatientParsed) {
  return {
    documentTypeId: parsed.documentTypeId,
    documentNumber: parsed.documentNumber,
    birthDate: new Date(`${parsed.birthDate}T00:00:00.000Z`),
    firstName: parsed.firstName,
    secondName: parsed.secondName ?? null,
    firstSurname: parsed.firstSurname,
    secondSurname: parsed.secondSurname ?? null,
    sexCatalogValueId: parsed.sexCatalogValueId,
    active: parsed.active,
    address: parsed.address ?? null,
    cityCatalogValueId: parsed.cityCatalogValueId,
    fixedPhone: parsed.fixedPhone ?? null,
    mobilePhone: parsed.mobilePhone,
    email: parsed.noEmail ? null : parsed.email?.trim() || null,
    noEmail: parsed.noEmail,
    residentialZoneCatalogValueId: parsed.residentialZoneCatalogValueId,
    userTypeCatalogValueId: parsed.userTypeCatalogValueId,
    nationalityCatalogValueId: parsed.nationalityCatalogValueId,
    insurerCatalogValueId: parsed.insurerCatalogValueId,
    patientOriginCatalogValueId: parsed.patientOriginCatalogValueId,
    treatmentCatalogValueId: parsed.treatmentCatalogValueId ?? null,
    documentExpeditionCityCatalogValueId:
      parsed.documentExpeditionCityCatalogValueId,
    entityCatalogValueId: parsed.entityCatalogValueId ?? null,
    planCatalogValueId: parsed.planCatalogValueId ?? null,
    habeasDataAccepted: parsed.habeasDataAccepted,
    status: "READY",
  };
}

function validate(values: PatientFormValues): PatientActionResult | PatientParsed {
  const parsed = patientSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Hay campos inválidos en el formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }
  return parsed.data;
}

export async function createPatient(
  values: PatientFormValues,
): Promise<PatientActionResult> {
  await requireAdmin();
  const result = validate(values);
  if ("ok" in result) return result;

  const refs = await validateCatalogRefs(result);
  if (!refs.ok) {
    return { ok: false, error: "Selecciones de catálogo inválidas.", fieldErrors: refs.fieldErrors };
  }

  try {
    const patient = await prisma.patient.create({ data: toPatientData(result) });
    revalidatePath("/admin");
    return { ok: true, id: patient.id };
  } catch (error) {
    console.error("createPatient failed", error);
    return { ok: false, error: "No se pudo guardar el paciente." };
  }
}

export async function updatePatient(
  id: string,
  values: PatientFormValues,
): Promise<PatientActionResult> {
  await requireAdmin();
  const result = validate(values);
  if ("ok" in result) return result;

  const refs = await validateCatalogRefs(result);
  if (!refs.ok) {
    return { ok: false, error: "Selecciones de catálogo inválidas.", fieldErrors: refs.fieldErrors };
  }

  try {
    await prisma.patient.update({ where: { id }, data: toPatientData(result) });
    revalidatePath("/admin");
    revalidatePath(`/patients/${id}`);
    return { ok: true, id };
  } catch (error) {
    console.error("updatePatient failed", error);
    return { ok: false, error: "No se pudo actualizar el paciente." };
  }
}
