import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { CATALOG_META, type CatalogKey } from "../features/catalogs/catalog-schema";

/**
 * Seed: catalogs, placeholder catalog values, the default D0-D9 mapping, and a
 * couple of sample patients.
 *
 * IMPORTANT: every `atheneaValue` here is a PLACEHOLDER. The real Athenea catalog
 * IDs and the real D0-D9 mapping are UNKNOWN in the source docs (see HANDOFF.md).
 * They are editable from the admin panel. The default mapping is seeded at
 * version 1 so exports can warn that placeholders are in use.
 *
 * dotenv loading and the Prisma client live inside `main()` (not at module top
 * level) so the file runs under tsx's CJS output without top-level await, both in
 * dev and from the slim production runner.
 */

type ValueSeed = { code: string; label: string; atheneaValue: string };

const CATALOG_VALUES: Record<CatalogKey, ValueSeed[]> = {
  documentType: [
    { code: "CC", label: "Cédula de ciudadanía", atheneaValue: "1" },
    { code: "TI", label: "Tarjeta de identidad", atheneaValue: "2" },
    { code: "CE", label: "Cédula de extranjería", atheneaValue: "3" },
    { code: "PA", label: "Pasaporte", atheneaValue: "4" },
    { code: "RC", label: "Registro civil", atheneaValue: "5" },
  ],
  sex: [
    { code: "M", label: "Masculino", atheneaValue: "1" },
    { code: "F", label: "Femenino", atheneaValue: "2" },
  ],
  city: [
    { code: "BOG", label: "Bogotá D.C.", atheneaValue: "11001" },
    { code: "MED", label: "Medellín", atheneaValue: "05001" },
    { code: "CAL", label: "Cali", atheneaValue: "76001" },
    { code: "BAQ", label: "Barranquilla", atheneaValue: "08001" },
    { code: "CTG", label: "Cartagena", atheneaValue: "13001" },
  ],
  residentialZone: [
    { code: "U", label: "Urbana", atheneaValue: "1" },
    { code: "R", label: "Rural", atheneaValue: "2" },
  ],
  userType: [
    { code: "PART", label: "Particular", atheneaValue: "1" },
    { code: "COT", label: "Cotizante", atheneaValue: "2" },
    { code: "BEN", label: "Beneficiario", atheneaValue: "3" },
  ],
  nationality: [
    { code: "CO", label: "Colombiana", atheneaValue: "170" },
    { code: "VE", label: "Venezolana", atheneaValue: "862" },
    { code: "OT", label: "Otra", atheneaValue: "999" },
  ],
  insurer: [
    { code: "NEPS", label: "Nueva EPS", atheneaValue: "1" },
    { code: "SURA", label: "Sura", atheneaValue: "2" },
    { code: "SANI", label: "Sanitas", atheneaValue: "3" },
    { code: "PART", label: "Particular", atheneaValue: "99" },
  ],
  patientOrigin: [
    { code: "EXT", label: "Consulta externa", atheneaValue: "1" },
    { code: "URG", label: "Urgencias", atheneaValue: "2" },
    { code: "DOM", label: "Domicilio", atheneaValue: "3" },
    { code: "CONV", label: "Convenio", atheneaValue: "4" },
  ],
  treatment: [
    { code: "NIN", label: "Ninguno", atheneaValue: "0" },
    { code: "QT", label: "Quimioterapia", atheneaValue: "1" },
    { code: "DIA", label: "Diálisis", atheneaValue: "2" },
  ],
  documentExpeditionCity: [
    { code: "BOG", label: "Bogotá D.C.", atheneaValue: "11001" },
    { code: "MED", label: "Medellín", atheneaValue: "05001" },
    { code: "CAL", label: "Cali", atheneaValue: "76001" },
  ],
  entity: [
    { code: "ENT-A", label: "Entidad A", atheneaValue: "100" },
    { code: "ENT-B", label: "Entidad B", atheneaValue: "200" },
  ],
  plan: [
    { code: "POS", label: "POS", atheneaValue: "1" },
    { code: "PC", label: "Plan Complementario", atheneaValue: "2" },
    { code: "PART", label: "Particular", atheneaValue: "3" },
  ],
};

// Default (PLACEHOLDER) D0-D9 + variable-dimension mapping.
const MAPPINGS: Array<{
  dimensionKey: string;
  sourceField: string;
  catalogKey: string | null;
  exportKey: string;
}> = [
  { dimensionKey: "D0", sourceField: "residentialZoneCatalogValueId", catalogKey: "residentialZone", exportKey: "D0" },
  { dimensionKey: "D1", sourceField: "userTypeCatalogValueId", catalogKey: "userType", exportKey: "D1" },
  { dimensionKey: "D2", sourceField: "nationalityCatalogValueId", catalogKey: "nationality", exportKey: "D2" },
  { dimensionKey: "D3", sourceField: "insurerCatalogValueId", catalogKey: "insurer", exportKey: "D3" },
  { dimensionKey: "D4", sourceField: "patientOriginCatalogValueId", catalogKey: "patientOrigin", exportKey: "D4" },
  { dimensionKey: "D5", sourceField: "treatmentCatalogValueId", catalogKey: "treatment", exportKey: "D5" },
  { dimensionKey: "D6", sourceField: "cityCatalogValueId", catalogKey: "city", exportKey: "D6" },
  { dimensionKey: "D7", sourceField: "documentExpeditionCityCatalogValueId", catalogKey: "documentExpeditionCity", exportKey: "D7" },
  { dimensionKey: "D8", sourceField: "address", catalogKey: null, exportKey: "D8" },
  { dimensionKey: "D9", sourceField: "", catalogKey: null, exportKey: "D9" },
  { dimensionKey: "ENTIDAD", sourceField: "entityCatalogValueId", catalogKey: "entity", exportKey: "ENTIDAD" },
  { dimensionKey: "PLAN", sourceField: "planCatalogValueId", catalogKey: "plan", exportKey: "PLAN" },
];

async function main() {
  // Load .env if dotenv is available (dev/local). The slim production runner has
  // no dotenv — there DATABASE_URL is injected by the environment, so we ignore it.
  try {
    await import("dotenv/config");
  } catch {
    // no-op: rely on process.env (Docker Compose injects it).
  }

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL ?? "",
  });
  const prisma = new PrismaClient({ adapter });

  try {
    await seed(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

async function seed(prisma: PrismaClient) {
  console.log("Seeding catalogs…");
  const valueIdByKeyCode = new Map<string, string>();

  for (const key of Object.keys(CATALOG_VALUES) as CatalogKey[]) {
    const meta = CATALOG_META[key];
    const catalog = await prisma.catalog.upsert({
      where: { key },
      create: { key, label: meta.label, description: meta.description },
      update: { label: meta.label, description: meta.description },
    });

    let sortOrder = 0;
    for (const value of CATALOG_VALUES[key]) {
      const created = await prisma.catalogValue.upsert({
        where: { catalogId_code: { catalogId: catalog.id, code: value.code } },
        create: {
          catalogId: catalog.id,
          code: value.code,
          label: value.label,
          atheneaValue: value.atheneaValue,
          sortOrder: sortOrder++,
        },
        update: { label: value.label, atheneaValue: value.atheneaValue },
      });
      valueIdByKeyCode.set(`${key}:${value.code}`, created.id);
    }
  }

  console.log("Seeding D0-D9 mapping…");
  for (const mapping of MAPPINGS) {
    await prisma.dimensionMapping.upsert({
      where: { dimensionKey: mapping.dimensionKey },
      create: { ...mapping, version: 1 },
      update: {
        sourceField: mapping.sourceField,
        catalogKey: mapping.catalogKey,
        exportKey: mapping.exportKey,
      },
    });
  }

  const id = (key: CatalogKey, code: string) => {
    const v = valueIdByKeyCode.get(`${key}:${code}`);
    if (!v) throw new Error(`Missing seeded catalog value ${key}:${code}`);
    return v;
  };

  console.log("Seeding sample patients…");
  const samples = [
    {
      documentTypeId: id("documentType", "CC"),
      documentNumber: "1018456789",
      birthDate: new Date(Date.UTC(1990, 3, 12)),
      firstName: "María",
      secondName: "Fernanda",
      firstSurname: "Rodríguez",
      secondSurname: "Gómez",
      sexCatalogValueId: id("sex", "F"),
      address: "Cra 15 # 93-47",
      cityCatalogValueId: id("city", "BOG"),
      mobilePhone: "3001234567",
      email: "maria.rodriguez@example.com",
      residentialZoneCatalogValueId: id("residentialZone", "U"),
      userTypeCatalogValueId: id("userType", "COT"),
      nationalityCatalogValueId: id("nationality", "CO"),
      insurerCatalogValueId: id("insurer", "SURA"),
      patientOriginCatalogValueId: id("patientOrigin", "EXT"),
      treatmentCatalogValueId: id("treatment", "NIN"),
      documentExpeditionCityCatalogValueId: id("documentExpeditionCity", "BOG"),
      entityCatalogValueId: id("entity", "ENT-A"),
      planCatalogValueId: id("plan", "POS"),
      habeasDataAccepted: true,
      status: "READY",
    },
    {
      documentTypeId: id("documentType", "CC"),
      documentNumber: "79456123",
      birthDate: new Date(Date.UTC(1985, 10, 3)),
      firstName: "Carlos",
      secondName: null,
      firstSurname: "Martínez",
      secondSurname: "Lopera",
      sexCatalogValueId: id("sex", "M"),
      address: "Calle 10 Sur # 50-20",
      cityCatalogValueId: id("city", "MED"),
      mobilePhone: "3109876543",
      email: null,
      noEmail: true,
      residentialZoneCatalogValueId: id("residentialZone", "U"),
      userTypeCatalogValueId: id("userType", "PART"),
      nationalityCatalogValueId: id("nationality", "CO"),
      insurerCatalogValueId: id("insurer", "PART"),
      patientOriginCatalogValueId: id("patientOrigin", "DOM"),
      documentExpeditionCityCatalogValueId: id("documentExpeditionCity", "MED"),
      entityCatalogValueId: id("entity", "ENT-B"),
      planCatalogValueId: id("plan", "PART"),
      habeasDataAccepted: true,
      status: "READY",
    },
  ];

  for (const sample of samples) {
    const existing = await prisma.patient.findFirst({
      where: { documentNumber: sample.documentNumber },
    });
    if (existing) {
      await prisma.patient.update({ where: { id: existing.id }, data: sample });
    } else {
      await prisma.patient.create({ data: sample });
    }
  }

  console.log("Seed complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
