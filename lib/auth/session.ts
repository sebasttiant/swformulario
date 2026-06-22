import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getConfig } from "@/lib/config/env";

/**
 * Minimal admin gate for the MVP. A single shared password (ADMIN_PASSWORD)
 * unlocks an HMAC-signed session cookie. No RBAC, no user table — intentionally
 * simple per scope. Replace before any real multi-user deployment.
 */

const COOKIE_NAME = "abad_session";
const SESSION_VALUE = "admin";

function sign(value: string): string {
  return createHmac("sha256", getConfig().sessionSecret)
    .update(value)
    .digest("hex");
}

function token(): string {
  return `${SESSION_VALUE}.${sign(SESSION_VALUE)}`;
}

function isValid(raw: string | undefined): boolean {
  if (!raw) return false;
  const [value, mac] = raw.split(".");
  if (value !== SESSION_VALUE || !mac) return false;
  const expected = sign(SESSION_VALUE);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return isValid(store.get(COOKIE_NAME)?.value);
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }
}

/** Verify the password and open a session. Returns false on mismatch. */
export async function createSession(password: string): Promise<boolean> {
  const expected = getConfig().adminPassword;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  const ok = a.length === b.length && timingSafeEqual(a, b);
  if (!ok) return false;

  const store = await cookies();
  store.set(COOKIE_NAME, token(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return true;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** The operator label recorded in export manifests. */
export async function currentOperator(): Promise<string | null> {
  return (await isAuthenticated()) ? "admin" : null;
}
