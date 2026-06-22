import { describe, it, expect } from "vitest";
import { exportFilename, manifestFilename } from "@/features/exports/filename";

const date = new Date(Date.UTC(2026, 5, 22, 14, 30, 15));

describe("exportFilename", () => {
  it("builds the individual JSON filename", () => {
    expect(exportFilename("individual", date)).toBe(
      "abad-athenea-individual-20260622-143015.json",
    );
  });

  it("builds the batch JSON filename", () => {
    expect(exportFilename("batch", date)).toBe(
      "abad-athenea-batch-20260622-143015.json",
    );
  });

  it("builds the excel filename with .xlsx extension", () => {
    expect(exportFilename("excel", date)).toBe(
      "abad-athenea-excel-20260622-143015.xlsx",
    );
  });
});

describe("manifestFilename", () => {
  it("builds the manifest filename", () => {
    expect(manifestFilename(date)).toBe(
      "abad-athenea-manifest-20260622-143015.json",
    );
  });
});
