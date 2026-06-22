import { NextResponse } from "next/server";
import { hasApiAccess } from "@/lib/auth/api-access";
import { buildPayloadsForPatients } from "@/features/exports/athenea-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/athenea/patients/:id
 *   -> a single `InsPaciente` payload, ready to POST to Athenea.
 *
 * Auth: admin session cookie OR `x-api-key: <EXPORT_API_KEY>` header.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await hasApiAccess(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const { payloads } = await buildPayloadsForPatients([id]);

  if (payloads.length === 0) {
    return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
  }

  // Return the bare InsPaciente object so it can be POSTed to Athenea as-is.
  return NextResponse.json(payloads[0]);
}
