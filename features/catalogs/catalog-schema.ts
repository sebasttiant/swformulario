import { z } from "zod";

/**
 * Canonical catalog keys. These map 1:1 to the selectable fields in the Athenea
 * patient screen (see DOCUMENTOS/123.jpeg and DOCUMENTOS/1234.jpeg). Every
 * value's Athenea ID lives in `CatalogValue.atheneaValue` and is editable from
 * the admin panel — we never hardcode Athenea IDs in the export builder.
 */
export const CATALOG_KEYS = [
  "documentType",
  "sex",
  "city",
  "residentialZone",
  "userType",
  "nationality",
  "insurer",
  "patientOrigin",
  "treatment",
  "documentExpeditionCity",
  "entity",
  "plan",
] as const;

export type CatalogKey = (typeof CATALOG_KEYS)[number];

export interface CatalogMeta {
  key: CatalogKey;
  label: string;
  description: string;
}

export const CATALOG_META: Record<CatalogKey, CatalogMeta> = {
  documentType: {
    key: "documentType",
    label: "Tipo de identificación",
    description: "Tipo de documento (CC, TI, CE, PA, RC...).",
  },
  sex: {
    key: "sex",
    label: "Sexo",
    description: "Género del paciente.",
  },
  city: {
    key: "city",
    label: "Ciudad",
    description: "Ciudad de residencia del paciente.",
  },
  residentialZone: {
    key: "residentialZone",
    label: "Zona residencial",
    description: "Zona residencial (urbana, rural...).",
  },
  userType: {
    key: "userType",
    label: "Tipo de usuario",
    description: "Tipo de usuario / régimen.",
  },
  nationality: {
    key: "nationality",
    label: "Nacionalidad",
    description: "Nacionalidad del paciente.",
  },
  insurer: {
    key: "insurer",
    label: "Aseguradora",
    description: "Entidad aseguradora / EPS.",
  },
  patientOrigin: {
    key: "patientOrigin",
    label: "Origen del paciente",
    description: "Origen o procedencia del paciente.",
  },
  treatment: {
    key: "treatment",
    label: "Tratamiento",
    description: "Tratamiento asociado (opcional).",
  },
  documentExpeditionCity: {
    key: "documentExpeditionCity",
    label: "Ciudad de expedición del documento",
    description: "Ciudad donde se expidió el documento.",
  },
  entity: {
    key: "entity",
    label: "Entidad",
    description: "Entidad (dimensión variable ENTIDAD).",
  },
  plan: {
    key: "plan",
    label: "Plan",
    description: "Plan (dimensión variable PLAN).",
  },
};

export const catalogValueSchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(1, "El código es obligatorio.").max(64),
  label: z.string().trim().min(1, "La etiqueta es obligatoria.").max(160),
  atheneaValue: z
    .string()
    .trim()
    .max(64)
    .describe("ID o valor que Athenea espera. Puede ser placeholder."),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export type CatalogValueInput = z.infer<typeof catalogValueSchema>;
