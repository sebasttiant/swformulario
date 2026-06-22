import { z } from "zod";

/**
 * Patient validation — the single source of truth for both the wizard (client)
 * and the server action. Required catalog fields mirror the Athenea patient
 * screen (DOCUMENTOS/123.jpeg, DOCUMENTOS/1234.jpeg) where a red asterisk marks
 * the mandatory fields.
 */

const COLOMBIAN_MOBILE = /^3\d{9}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const requiredText = (msg: string) => z.string().trim().min(1, msg);
const optionalText = () =>
  z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" ? undefined : v));

export const patientSchema = z
  .object({
    // Step 1 — Identification
    documentTypeId: requiredText("Seleccione el tipo de identificación."),
    documentNumber: requiredText("El número de documento es obligatorio.")
      .regex(/^[0-9A-Za-z-]+$/, "Número de documento inválido."),
    firstName: requiredText("El primer nombre es obligatorio."),
    secondName: optionalText(),
    firstSurname: requiredText("El primer apellido es obligatorio."),
    secondSurname: optionalText(),
    birthDate: requiredText("La fecha de nacimiento es obligatoria."),
    sexCatalogValueId: requiredText("Seleccione el sexo."),
    active: z.boolean().default(true),

    // Step 2 — Contact
    fixedPhone: optionalText(),
    mobilePhone: requiredText("El teléfono móvil es obligatorio.").regex(
      COLOMBIAN_MOBILE,
      "El móvil debe tener 10 dígitos y empezar con 3.",
    ),
    email: z.string().trim().optional().default(""),
    noEmail: z.boolean().default(false),

    // Step 3 — Location
    address: optionalText(),
    cityCatalogValueId: requiredText("Seleccione la ciudad."),
    residentialZoneCatalogValueId: requiredText("Seleccione la zona residencial."),
    nationalityCatalogValueId: requiredText("Seleccione la nacionalidad."),

    // Step 4 — Administrative
    userTypeCatalogValueId: requiredText("Seleccione el tipo de usuario."),
    insurerCatalogValueId: requiredText("Seleccione la aseguradora."),
    patientOriginCatalogValueId: requiredText("Seleccione el origen del paciente."),
    treatmentCatalogValueId: optionalText(),
    documentExpeditionCityCatalogValueId: requiredText(
      "Seleccione la ciudad de expedición del documento.",
    ),
    entityCatalogValueId: optionalText(),
    planCatalogValueId: optionalText(),

    // Step 5 — Habeas Data
    habeasDataAccepted: z.boolean(),
  })
  .superRefine((data, ctx) => {
    // Birth date must be a valid, non-future date.
    const parsed = new Date(`${data.birthDate}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
      ctx.addIssue({
        code: "custom",
        path: ["birthDate"],
        message: "Fecha de nacimiento inválida.",
      });
    } else if (parsed.getTime() > Date.now()) {
      ctx.addIssue({
        code: "custom",
        path: ["birthDate"],
        message: "La fecha de nacimiento no puede ser futura.",
      });
    }

    // Email required unless "Sin correo" is checked.
    if (!data.noEmail) {
      const email = data.email?.trim() ?? "";
      if (email.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["email"],
          message: "El correo es obligatorio (o marque «Sin correo»).",
        });
      } else if (!EMAIL.test(email)) {
        ctx.addIssue({
          code: "custom",
          path: ["email"],
          message: "Correo electrónico inválido.",
        });
      }
    }

    // Habeas Data authorization is mandatory.
    if (!data.habeasDataAccepted) {
      ctx.addIssue({
        code: "custom",
        path: ["habeasDataAccepted"],
        message: "Debe autorizar el tratamiento de datos personales.",
      });
    }
  });

export type PatientFormValues = z.input<typeof patientSchema>;
export type PatientParsed = z.output<typeof patientSchema>;

/** Empty defaults for a fresh wizard. */
export const emptyPatientValues: PatientFormValues = {
  documentTypeId: "",
  documentNumber: "",
  firstName: "",
  secondName: "",
  firstSurname: "",
  secondSurname: "",
  birthDate: "",
  sexCatalogValueId: "",
  active: true,
  fixedPhone: "",
  mobilePhone: "",
  email: "",
  noEmail: false,
  address: "",
  cityCatalogValueId: "",
  residentialZoneCatalogValueId: "",
  nationalityCatalogValueId: "",
  userTypeCatalogValueId: "",
  insurerCatalogValueId: "",
  patientOriginCatalogValueId: "",
  treatmentCatalogValueId: "",
  documentExpeditionCityCatalogValueId: "",
  entityCatalogValueId: "",
  planCatalogValueId: "",
  habeasDataAccepted: false,
};

/** Fields validated at each wizard step (for per-step `trigger`). */
export const STEP_FIELDS: Array<Array<keyof PatientFormValues>> = [
  // Step 0 — Document verification
  ["documentTypeId", "documentNumber"],
  // Step 1 — Identification
  [
    "documentTypeId",
    "documentNumber",
    "firstName",
    "firstSurname",
    "birthDate",
    "sexCatalogValueId",
  ],
  // Step 2 — Contact
  ["mobilePhone", "email", "noEmail"],
  // Step 3 — Location
  [
    "address",
    "cityCatalogValueId",
    "residentialZoneCatalogValueId",
    "nationalityCatalogValueId",
  ],
  // Step 4 — Administrative
  [
    "userTypeCatalogValueId",
    "insurerCatalogValueId",
    "patientOriginCatalogValueId",
    "documentExpeditionCityCatalogValueId",
  ],
  // Step 5 — Habeas Data
  ["habeasDataAccepted"],
];
