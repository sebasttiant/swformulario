import { describe, it, expect } from "vitest";
import { buildManifest } from "@/features/exports/manifest";

describe("buildManifest", () => {
  const generatedAt = new Date(Date.UTC(2026, 5, 22, 14, 30, 15));

  it("derives count from patient ids and carries metadata", () => {
    const manifest = buildManifest({
      generatedAt,
      generatedBy: "admin",
      type: "batch",
      filename: "abad-athenea-batch-20260622-143015.json",
      patientIds: ["a", "b", "c"],
      mappingVersion: 2,
      warnings: ["Mapeo D0-D9 placeholder"],
    });

    expect(manifest.patientCount).toBe(3);
    expect(manifest.patientIds).toEqual(["a", "b", "c"]);
    expect(manifest.generatedAt).toBe("2026-06-22T14:30:15.000Z");
    expect(manifest.generatedBy).toBe("admin");
    expect(manifest.mappingVersion).toBe(2);
    expect(manifest.warnings).toContain("Mapeo D0-D9 placeholder");
  });

  it("defaults generatedBy to null and warnings to empty", () => {
    const manifest = buildManifest({
      generatedAt,
      type: "individual",
      filename: "x.json",
      patientIds: ["only"],
      mappingVersion: 1,
    });
    expect(manifest.generatedBy).toBeNull();
    expect(manifest.warnings).toEqual([]);
    expect(manifest.patientCount).toBe(1);
  });
});
