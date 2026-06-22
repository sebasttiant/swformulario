import { NextResponse } from "next/server";
import { hasApiAccess } from "@/lib/auth/api-access";
import { buildPayloadsForPatients } from "@/features/exports/athenea-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/athenea/patients
 *   -> batch of `InsPaciente` payloads (the exact documented Athenea shape).
 *
 * Query params:
 *   ?ids=a,b,c   restrict to specific patient ids (default: all patients)
 *
 * Auth: admin session cookie OR `x-api-key: <EXPORT_API_KEY>` header.
 *
 * This is the machine-consumable counterpart to the file exports: an Athenea
 * integration layer can pull this and POST each item to `insPaciente`.
 */
export async function GET(req: Request) {
  if (!(await hasApiAccess(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(req.url);
  const idsParam = url.searchParams.get("ids");
  const ids = idsParam
    ? idsParam.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;

  const { payloads, patientIds, mappingVersion, warnings } =
    await buildPayloadsForPatients(ids);

  return NextResponse.json({
    method: "insPaciente",
    endpoint: "Api/General/Pacientes/insPaciente",
    generatedAt: new Date().toISOString(),
    mappingVersion,
    count: payloads.length,
    warnings,
    patientIds,
    pacientes: payloads,
  });
}
