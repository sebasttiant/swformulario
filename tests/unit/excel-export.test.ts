import { describe, it, expect } from "vitest";
import { flattenPayload, excelColumns } from "@/features/exports/excel-export";
import { buildAtheneaPayload } from "@/features/exports/athenea-payload";

function payload(sexKey: "SEXO" | "IDSEXO") {
  return buildAtheneaPayload(
    {
      documentTypeAtheneaValue: "1",
      documentNumber: "123",
      birthDate: new Date(Date.UTC(1990, 0, 1)),
      firstName: "ANA",
      firstSurname: "LOPEZ",
      sexAtheneaValue: "2",
      active: true,
      dimensions: { D0: "10" },
    },
    { sexExportKey: sexKey, dateFormat: "yyyy-MM-dd" },
  );
}

describe("excel export honors the configurable gender key", () => {
  it("uses SEXO column when configured as SEXO", () => {
    const row = flattenPayload(payload("SEXO"), "SEXO");
    expect(row.SEXO).toBe("2");
    expect(row.IDSEXO).toBeUndefined();
    expect(excelColumns("SEXO")).toContain("SEXO");
    expect(excelColumns("SEXO")).not.toContain("IDSEXO");
  });

  it("uses IDSEXO column when configured as IDSEXO", () => {
    const row = flattenPayload(payload("IDSEXO"), "IDSEXO");
    expect(row.IDSEXO).toBe("2");
    expect(row.SEXO).toBeUndefined();
    expect(excelColumns("IDSEXO")).toContain("IDSEXO");
    expect(excelColumns("IDSEXO")).not.toContain("SEXO");
  });

  it("flattens dimensions and variable dimensions", () => {
    const row = flattenPayload(payload("SEXO"), "SEXO");
    expect(row.D0).toBe("10");
    expect(row.D9).toBe("");
    expect(row).toHaveProperty("ENTIDAD");
    expect(row).toHaveProperty("PLAN");
  });
});
