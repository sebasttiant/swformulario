import { prisma } from "@/lib/db/prisma";

export interface PatientListItem {
  id: string;
  documentNumber: string;
  fullName: string;
  status: string;
  createdAt: Date;
}

/** List patients, optionally filtered by document number or name. */
export async function getPatients(search?: string): Promise<PatientListItem[]> {
  const term = search?.trim();
  const rows = await prisma.patient.findMany({
    orderBy: { createdAt: "desc" },
    where: term
      ? {
          OR: [
            { documentNumber: { contains: term, mode: "insensitive" } },
            { firstName: { contains: term, mode: "insensitive" } },
            { secondName: { contains: term, mode: "insensitive" } },
            { firstSurname: { contains: term, mode: "insensitive" } },
            { secondSurname: { contains: term, mode: "insensitive" } },
          ],
        }
      : undefined,
  });

  return rows.map((p) => ({
    id: p.id,
    documentNumber: p.documentNumber,
    fullName: [p.firstName, p.secondName, p.firstSurname, p.secondSurname]
      .filter(Boolean)
      .join(" "),
    status: p.status,
    createdAt: p.createdAt,
  }));
}

export async function getPatient(id: string) {
  return prisma.patient.findUnique({ where: { id } });
}

export async function getPatientCount(): Promise<number> {
  return prisma.patient.count();
}
