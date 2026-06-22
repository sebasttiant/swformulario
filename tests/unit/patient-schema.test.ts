import { describe, it, expect } from "vitest";
import { patientSchema, emptyPatientValues } from "@/features/patients/patient-schema";

function validBase() {
  return {
    ...emptyPatientValues,
    documentTypeId: "ct_cc",
    documentNumber: "1234567890",
    firstName: "Juan",
    firstSurname: "Perez",
    birthDate: "1990-05-17",
    sexCatalogValueId: "sex_m",
    mobilePhone: "3001234567",
    email: "juan@example.com",
    cityCatalogValueId: "city_bog",
    residentialZoneCatalogValueId: "zone_u",
    nationalityCatalogValueId: "nat_co",
    userTypeCatalogValueId: "ut_1",
    insurerCatalogValueId: "ins_1",
    patientOriginCatalogValueId: "po_1",
    documentExpeditionCityCatalogValueId: "city_bog",
    habeasDataAccepted: true,
  };
}

describe("patientSchema", () => {
  it("accepts a fully valid patient", () => {
    expect(patientSchema.safeParse(validBase()).success).toBe(true);
  });

  it("rejects a non-Colombian mobile", () => {
    const r = patientSchema.safeParse({ ...validBase(), mobilePhone: "6012345678" });
    expect(r.success).toBe(false);
  });

  it("rejects a future birth date", () => {
    const r = patientSchema.safeParse({ ...validBase(), birthDate: "2999-01-01" });
    expect(r.success).toBe(false);
  });

  it("requires email unless noEmail is checked", () => {
    const missing = patientSchema.safeParse({ ...validBase(), email: "" });
    expect(missing.success).toBe(false);

    const waived = patientSchema.safeParse({
      ...validBase(),
      email: "",
      noEmail: true,
    });
    expect(waived.success).toBe(true);
  });

  it("requires the Habeas Data authorization", () => {
    const r = patientSchema.safeParse({ ...validBase(), habeasDataAccepted: false });
    expect(r.success).toBe(false);
  });

  it("requires document number", () => {
    const r = patientSchema.safeParse({ ...validBase(), documentNumber: "" });
    expect(r.success).toBe(false);
  });
});
