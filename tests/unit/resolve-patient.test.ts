import { describe, it, expect } from "vitest";
import type { Patient, DimensionMapping } from "@prisma/client";
import {
  resolvePatientToInput,
  buildAtheneaValueMap,
} from "@/features/exports/resolve-patient";

function makeMapping(
  dimensionKey: string,
  sourceField: string,
  catalogKey: string | null,
): DimensionMapping {
  return {
    id: dimensionKey,
    dimensionKey,
    sourceField,
    catalogKey,
    exportKey: dimensionKey,
    active: true,
    version: 1,
    updatedAt: new Date(),
  };
}

const mappings = [
  makeMapping("D6", "cityCatalogValueId", "city"),
  makeMapping("D2", "nationalityCatalogValueId", "nationality"),
];

const atheneaValueById = buildAtheneaValueMap([
  { id: "city-bog", atheneaValue: "11001" },
  { id: "city-otro", atheneaValue: "OTRO" },
  { id: "nat-co", atheneaValue: "170" },
  { id: "nat-otro", atheneaValue: "999" },
]);

function makePatient(overrides: Partial<Patient>): Patient {
  return {
    cityCatalogValueId: null,
    cityOther: null,
    nationalityCatalogValueId: null,
    nationalityOther: null,
    ...overrides,
  } as unknown as Patient;
}

describe("resolvePatientToInput — Otro free text", () => {
  it("uses the catalog Athenea value for a normal city/nationality", () => {
    const patient = makePatient({
      cityCatalogValueId: "city-bog",
      nationalityCatalogValueId: "nat-co",
    });
    const input = resolvePatientToInput(patient, { atheneaValueById, mappings });
    expect(input.dimensions.D6).toBe("11001");
    expect(input.dimensions.D2).toBe("170");
  });

  it("exports the free text when 'Otro' is selected and text is present", () => {
    const patient = makePatient({
      cityCatalogValueId: "city-otro",
      cityOther: "Sabaneta",
      nationalityCatalogValueId: "nat-otro",
      nationalityOther: "Italiana",
    });
    const input = resolvePatientToInput(patient, { atheneaValueById, mappings });
    expect(input.dimensions.D6).toBe("Sabaneta");
    expect(input.dimensions.D2).toBe("Italiana");
  });

  it("falls back to the catalog value when 'Otro' text is blank", () => {
    const patient = makePatient({
      cityCatalogValueId: "city-otro",
      cityOther: "   ",
    });
    const input = resolvePatientToInput(patient, { atheneaValueById, mappings });
    expect(input.dimensions.D6).toBe("OTRO");
  });
});
