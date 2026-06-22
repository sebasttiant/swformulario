import { describe, it, expect } from "vitest";
import {
  buildAtheneaPayload,
  findMissingRequiredValues,
  formatAtheneaDate,
  type AtheneaPatientInput,
  type AtheneaExportConfig,
} from "@/features/exports/athenea-payload";

const baseInput: AtheneaPatientInput = {
  documentTypeAtheneaValue: "1",
  documentNumber: "2222222",
  birthDate: new Date(Date.UTC(1990, 4, 17)),
  firstName: "JUAN",
  secondName: "CARLOS",
  firstSurname: "PEREZ",
  secondSurname: "GOMEZ",
  sexAtheneaValue: "1",
  active: true,
  dimensions: { D0: "10", D3: "ABC" },
  entidad: "55",
  plan: "POS",
};

const config: AtheneaExportConfig = {
  sexExportKey: "SEXO",
  dateFormat: "yyyy-MM-dd",
};

describe("buildAtheneaPayload", () => {
  it("maps every documented InsPaciente key", () => {
    const payload = buildAtheneaPayload(baseInput, config);
    expect(payload).toMatchObject({
      TIPOIDENTIFICACION: "1",
      NUMEROIDENTIFICACION: "2222222",
      FECHANACIMIENTO: "1990-05-17",
      NOMBRE1: "JUAN",
      NOMBRE2: "CARLOS",
      APELLIDO1: "PEREZ",
      APELLIDO2: "GOMEZ",
      SEXO: "1",
      ACTIVO: true,
      D0: "10",
      D1: "",
      D2: "",
      D3: "ABC",
      D9: "",
      DIMENSIONESVARIABLES: { ENTIDAD: "55", PLAN: "POS" },
    });
  });

  it("keeps the document number as an exact string", () => {
    const payload = buildAtheneaPayload(
      { ...baseInput, documentNumber: "0012300" },
      config,
    );
    expect(payload.NUMEROIDENTIFICACION).toBe("0012300");
    expect(typeof payload.NUMEROIDENTIFICACION).toBe("string");
  });

  it("emits all D0..D9 keys even when unset", () => {
    const payload = buildAtheneaPayload({ ...baseInput, dimensions: {} }, config);
    for (let i = 0; i <= 9; i++) {
      expect(payload[`D${i}`]).toBe("");
    }
  });

  it("centralizes empty handling for optional fields", () => {
    const payload = buildAtheneaPayload(
      { ...baseInput, secondName: null, secondSurname: undefined, entidad: null },
      config,
    );
    expect(payload.NOMBRE2).toBe("");
    expect(payload.APELLIDO2).toBe("");
    expect(payload.DIMENSIONESVARIABLES.ENTIDAD).toBe("");
  });

  it("uses IDSEXO when configured, never both keys", () => {
    const payload = buildAtheneaPayload(baseInput, {
      ...config,
      sexExportKey: "IDSEXO",
    });
    expect(payload.IDSEXO).toBe("1");
    expect(payload.SEXO).toBeUndefined();
  });
});

describe("findMissingRequiredValues", () => {
  it("flags a missing/invalid catalog mapping (empty required value)", () => {
    // documentType catalog id did not resolve -> TIPOIDENTIFICACION empty.
    const payload = buildAtheneaPayload(
      { ...baseInput, documentTypeAtheneaValue: "", sexAtheneaValue: "" },
      config,
    );
    const missing = findMissingRequiredValues(payload, "SEXO");
    expect(missing).toContain("TIPOIDENTIFICACION");
    expect(missing).toContain("SEXO");
  });

  it("returns empty when all required values resolved", () => {
    const payload = buildAtheneaPayload(baseInput, config);
    expect(findMissingRequiredValues(payload, "SEXO")).toEqual([]);
  });

  it("checks IDSEXO when that key is configured", () => {
    const payload = buildAtheneaPayload(
      { ...baseInput, sexAtheneaValue: "" },
      { ...config, sexExportKey: "IDSEXO" },
    );
    expect(findMissingRequiredValues(payload, "IDSEXO")).toContain("IDSEXO");
  });
});

describe("formatAtheneaDate", () => {
  it("is timezone-stable (UTC)", () => {
    const date = new Date(Date.UTC(2026, 0, 5, 23, 59, 0));
    expect(formatAtheneaDate(date, "yyyy-MM-dd")).toBe("2026-01-05");
    expect(formatAtheneaDate(date, "dd/MM/yyyy")).toBe("05/01/2026");
  });
});
