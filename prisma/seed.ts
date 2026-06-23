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

/**
 * Colombian municipalities with their DANE (DIVIPOLA) code as the Athenea value.
 * Department capitals plus the largest municipalities. The trailing "Otro" entry
 * lets operators capture a municipality outside this list via free text.
 */
const COLOMBIAN_CITIES: ValueSeed[] = [
  { code: "BOG", label: "Bogotá D.C.", atheneaValue: "11001" },
  { code: "MED", label: "Medellín", atheneaValue: "05001" },
  { code: "CAL", label: "Cali", atheneaValue: "76001" },
  { code: "BAQ", label: "Barranquilla", atheneaValue: "08001" },
  { code: "CTG", label: "Cartagena", atheneaValue: "13001" },
  { code: "CUC", label: "Cúcuta", atheneaValue: "54001" },
  { code: "BGA", label: "Bucaramanga", atheneaValue: "68001" },
  { code: "PEI", label: "Pereira", atheneaValue: "66001" },
  { code: "SMR", label: "Santa Marta", atheneaValue: "47001" },
  { code: "IBE", label: "Ibagué", atheneaValue: "73001" },
  { code: "MZL", label: "Manizales", atheneaValue: "17001" },
  { code: "VVC", label: "Villavicencio", atheneaValue: "50001" },
  { code: "PAS", label: "Pasto", atheneaValue: "52001" },
  { code: "MTR", label: "Montería", atheneaValue: "23001" },
  { code: "NVA", label: "Neiva", atheneaValue: "41001" },
  { code: "ARM", label: "Armenia", atheneaValue: "63001" },
  { code: "PPN", label: "Popayán", atheneaValue: "19001" },
  { code: "SIN", label: "Sincelejo", atheneaValue: "70001" },
  { code: "VUP", label: "Valledupar", atheneaValue: "20001" },
  { code: "TUN", label: "Tunja", atheneaValue: "15001" },
  { code: "RCH", label: "Riohacha", atheneaValue: "44001" },
  { code: "FLA", label: "Florencia", atheneaValue: "18001" },
  { code: "YOP", label: "Yopal", atheneaValue: "85001" },
  { code: "QIB", label: "Quibdó", atheneaValue: "27001" },
  { code: "MOC", label: "Mocoa", atheneaValue: "86001" },
  { code: "ARA", label: "Arauca", atheneaValue: "81001" },
  { code: "SJG", label: "San José del Guaviare", atheneaValue: "95001" },
  { code: "LET", label: "Leticia", atheneaValue: "91001" },
  { code: "MIT", label: "Mitú", atheneaValue: "97001" },
  { code: "PCA", label: "Puerto Carreño", atheneaValue: "99001" },
  { code: "INI", label: "Inírida", atheneaValue: "94001" },
  { code: "SAI", label: "San Andrés", atheneaValue: "88001" },
  { code: "SOL", label: "Soledad", atheneaValue: "08758" },
  { code: "SOA", label: "Soacha", atheneaValue: "25754" },
  { code: "BEL", label: "Bello", atheneaValue: "05088" },
  { code: "ITA", label: "Itagüí", atheneaValue: "05360" },
  { code: "ENV", label: "Envigado", atheneaValue: "05266" },
  { code: "APA", label: "Apartadó", atheneaValue: "05045" },
  { code: "TBO", label: "Turbo", atheneaValue: "05837" },
  { code: "PAL", label: "Palmira", atheneaValue: "76520" },
  { code: "BUN", label: "Buenaventura", atheneaValue: "76109" },
  { code: "TUL", label: "Tuluá", atheneaValue: "76834" },
  { code: "CGO", label: "Cartago", atheneaValue: "76147" },
  { code: "FLB", label: "Floridablanca", atheneaValue: "68276" },
  { code: "GIR", label: "Girón", atheneaValue: "68307" },
  { code: "BRB", label: "Barrancabermeja", atheneaValue: "68081" },
  { code: "DOS", label: "Dosquebradas", atheneaValue: "66170" },
  { code: "MAI", label: "Maicao", atheneaValue: "44430" },
  { code: "MGA", label: "Magangué", atheneaValue: "13430" },
  { code: "FAC", label: "Facatativá", atheneaValue: "25269" },
  { code: "ZIP", label: "Zipaquirá", atheneaValue: "25899" },
  { code: "CHI", label: "Chía", atheneaValue: "25175" },
  { code: "GIA", label: "Girardot", atheneaValue: "25307" },
  { code: "FUS", label: "Fusagasugá", atheneaValue: "25290" },
];

/** "Otro" option for the city catalog (paired with the cityOther free text). */
const OTRO_CITY: ValueSeed = { code: "OTRO", label: "Otro", atheneaValue: "OTRO" };

/**
 * Nationalities with the ISO 3166-1 numeric country code as the Athenea value
 * (leading zeros preserved, e.g. Brasil = 076). The trailing "Otro" entry lets
 * operators capture a nationality outside this list via free text.
 */
const NATIONALITIES: ValueSeed[] = [
  { code: "CO", label: "Colombiana", atheneaValue: "170" },
  { code: "VE", label: "Venezolana", atheneaValue: "862" },
  { code: "EC", label: "Ecuatoriana", atheneaValue: "218" },
  { code: "PE", label: "Peruana", atheneaValue: "604" },
  { code: "BR", label: "Brasileña", atheneaValue: "076" },
  { code: "AR", label: "Argentina", atheneaValue: "032" },
  { code: "CL", label: "Chilena", atheneaValue: "152" },
  { code: "BO", label: "Boliviana", atheneaValue: "068" },
  { code: "PY", label: "Paraguaya", atheneaValue: "600" },
  { code: "UY", label: "Uruguaya", atheneaValue: "858" },
  { code: "MX", label: "Mexicana", atheneaValue: "484" },
  { code: "PA", label: "Panameña", atheneaValue: "591" },
  { code: "CR", label: "Costarricense", atheneaValue: "188" },
  { code: "NI", label: "Nicaragüense", atheneaValue: "558" },
  { code: "HN", label: "Hondureña", atheneaValue: "340" },
  { code: "GT", label: "Guatemalteca", atheneaValue: "320" },
  { code: "SV", label: "Salvadoreña", atheneaValue: "222" },
  { code: "DO", label: "Dominicana", atheneaValue: "214" },
  { code: "HT", label: "Haitiana", atheneaValue: "332" },
  { code: "CU", label: "Cubana", atheneaValue: "192" },
  { code: "PR", label: "Puertorriqueña", atheneaValue: "630" },
  { code: "JM", label: "Jamaiquina", atheneaValue: "388" },
  { code: "TT", label: "Trinitense", atheneaValue: "780" },
  { code: "GY", label: "Guyanesa", atheneaValue: "328" },
  { code: "SR", label: "Surinamesa", atheneaValue: "740" },
  { code: "US", label: "Estadounidense", atheneaValue: "840" },
  { code: "CA", label: "Canadiense", atheneaValue: "124" },
  { code: "ES", label: "Española", atheneaValue: "724" },
  { code: "PT", label: "Portuguesa", atheneaValue: "620" },
  { code: "IT", label: "Italiana", atheneaValue: "380" },
  { code: "FR", label: "Francesa", atheneaValue: "250" },
  { code: "DE", label: "Alemana", atheneaValue: "276" },
  { code: "GB", label: "Británica", atheneaValue: "826" },
  { code: "NL", label: "Neerlandesa", atheneaValue: "528" },
  { code: "BE", label: "Belga", atheneaValue: "056" },
  { code: "CH", label: "Suiza", atheneaValue: "756" },
  { code: "SE", label: "Sueca", atheneaValue: "752" },
  { code: "NO", label: "Noruega", atheneaValue: "578" },
  { code: "DK", label: "Danesa", atheneaValue: "208" },
  { code: "RU", label: "Rusa", atheneaValue: "643" },
  { code: "CN", label: "China", atheneaValue: "156" },
  { code: "JP", label: "Japonesa", atheneaValue: "392" },
  { code: "KR", label: "Surcoreana", atheneaValue: "410" },
  { code: "IN", label: "India", atheneaValue: "356" },
  { code: "PH", label: "Filipina", atheneaValue: "608" },
  { code: "AU", label: "Australiana", atheneaValue: "036" },
  { code: "NZ", label: "Neozelandesa", atheneaValue: "554" },
  { code: "ZA", label: "Sudafricana", atheneaValue: "710" },
  { code: "EG", label: "Egipcia", atheneaValue: "818" },
  { code: "NG", label: "Nigeriana", atheneaValue: "566" },
  { code: "MA", label: "Marroquí", atheneaValue: "504" },
  { code: "TR", label: "Turca", atheneaValue: "792" },
  { code: "IL", label: "Israelí", atheneaValue: "376" },
  { code: "LB", label: "Libanesa", atheneaValue: "422" },
  { code: "SY", label: "Siria", atheneaValue: "760" },
  { code: "OT", label: "Otra", atheneaValue: "999" },
];

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
  city: [...COLOMBIAN_CITIES, OTRO_CITY],
  residentialZone: [
    { code: "U", label: "Urbana", atheneaValue: "1" },
    { code: "R", label: "Rural", atheneaValue: "2" },
  ],
  userType: [
    { code: "PART", label: "Particular", atheneaValue: "1" },
    { code: "COT", label: "Cotizante", atheneaValue: "2" },
    { code: "BEN", label: "Beneficiario", atheneaValue: "3" },
  ],
  nationality: NATIONALITIES,
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
  documentExpeditionCity: COLOMBIAN_CITIES,
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
