import { describe, expect, it } from "vitest";
import { getVisibleStepNumber } from "@/features/patients/patient-wizard";

describe("patient wizard step numbering", () => {
  it("starts visible step numbers at one", () => {
    expect(getVisibleStepNumber(0)).toBe(1);
    expect(getVisibleStepNumber(1)).toBe(2);
  });
});
