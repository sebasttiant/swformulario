import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getConfig } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "./password";
import type { AdminRole } from "@prisma/client";

/**
 * Email + password auth backed by the AdminUser table, with two roles
 * (ADMIN, SUPER_ADMIN). The signed cookie stores only the user id; the role and
 * active flag are re-read from the DB on every request so deactivating a user or
 * changing a role takes effect immediately (no stale role in the token).
 *
 * Authorization helpers (requireAdmin / requireSuperAdmin) are the server-side
 * gate. UI hiding is never the security boundary.
 */

const COOKIE_NAME = "abad_session";

export interface SessionUser {
  id: string;
  email: string;
  role: AdminRole;
}

function sign(value: string): string {
  return createHmac("sha256", getConfig().sessionSecret)
    .update(value)
    .digest("hex");
}

/** Validate the cookie signature and return the embedded user id, or null. */
function readSignedUserId(raw: string | undefined): string | null {
  if (!raw) return null;
  const idx = raw.lastIndexOf(".");
  if (idx <= 0) return null;
  const value = raw.slice(0, idx);
  const mac = raw.slice(idx + 1);
  const expected = sign(value);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return value;
}

/** The authenticated, ACTIVE admin for this request, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const userId = readSignedUserId(store.get(COOKIE_NAME)?.value);
  if (!userId) return null;

  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, active: true },
  });
  if (!user || !user.active) return null;
  return { id: user.id, email: user.email, role: user.role };
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getSessionUser()) !== null;
}

/** Require any authenticated admin (ADMIN or SUPER_ADMIN). */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** Require SUPER_ADMIN. Unauthenticated → /login; authenticated-but-not-super
 * → home (authorization failure, not an auth failure). */
export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "SUPER_ADMIN") redirect("/");
  return user;
}

export async function isSuperAdmin(): Promise<boolean> {
  return (await getSessionUser())?.role === "SUPER_ADMIN";
}

/** Verify email + password against an active AdminUser and open a session. */
export async function createSession(
  email: string,
  password: string,
): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password) return false;

  const user = await prisma.adminUser.findUnique({
    where: { email: normalized },
    select: { id: true, passwordHash: true, active: true },
  });
  if (!user || !user.active) return false;

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return false;

  const store = await cookies();
  store.set(COOKIE_NAME, `${user.id}.${sign(user.id)}`, {
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

/** The operator label recorded in export manifests (the admin's email). */
export async function currentOperator(): Promise<string | null> {
  return (await getSessionUser())?.email ?? null;
}
