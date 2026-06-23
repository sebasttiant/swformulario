import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password hashing", () => {
  it("verifies a correct password against its hash", async () => {
    const sample = "S0me-Str0ng-Passw0rd!";
    const hash = await hashPassword(sample);
    expect(hash).toContain(":");
    expect(hash).not.toContain(sample); // never stored in plaintext
    expect(await verifyPassword(sample, hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("correct-horse");
    expect(await verifyPassword("wrong-horse", hash)).toBe(false);
  });

  it("produces a unique salt per hash", async () => {
    const a = await hashPassword("same-password");
    const b = await hashPassword("same-password");
    expect(a).not.toBe(b);
  });

  it("returns false on malformed stored values", async () => {
    expect(await verifyPassword("x", "not-a-valid-hash")).toBe(false);
    expect(await verifyPassword("x", "")).toBe(false);
  });
});
