"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireSuperAdmin } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { countActiveSuperAdmins } from "./admin-data";
import type { AdminRole } from "@prisma/client";

export type AdminActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

const emailSchema = z.string().trim().toLowerCase().email("Correo inválido.");
const passwordSchema = z
  .string()
  .min(8, "La contraseña temporal debe tener al menos 8 caracteres.");
const roleSchema = z.enum(["ADMIN", "SUPER_ADMIN"]);

/**
 * Create a new admin. SUPER_ADMIN-only (enforced server-side). The temporary
 * password is hashed before storage and never returned.
 */
export async function createAdmin(input: {
  email: string;
  password: string;
  role: AdminRole;
}): Promise<AdminActionResult> {
  await requireSuperAdmin();

  const email = emailSchema.safeParse(input.email);
  const password = passwordSchema.safeParse(input.password);
  const role = roleSchema.safeParse(input.role);
  if (!email.success) return { ok: false, error: email.error.issues[0].message };
  if (!password.success)
    return { ok: false, error: password.error.issues[0].message };
  if (!role.success) return { ok: false, error: "Rol inválido." };

  const existing = await prisma.adminUser.findUnique({
    where: { email: email.data },
    select: { id: true },
  });
  if (existing) return { ok: false, error: "Ya existe un admin con ese correo." };

  await prisma.adminUser.create({
    data: {
      email: email.data,
      passwordHash: await hashPassword(password.data),
      role: role.data,
      active: true,
    },
  });
  revalidatePath("/admin/users");
  return { ok: true, message: "Admin creado." };
}

/**
 * Activate/deactivate an admin. Guards against self-lockout and against leaving
 * the system with no active SUPER_ADMIN.
 */
export async function setAdminActive(
  id: string,
  active: boolean,
): Promise<AdminActionResult> {
  const me = await requireSuperAdmin();

  if (id === me.id && !active) {
    return { ok: false, error: "No puedes desactivar tu propia cuenta." };
  }

  const target = await prisma.adminUser.findUnique({
    where: { id },
    select: { id: true, role: true, active: true },
  });
  if (!target) return { ok: false, error: "Admin no encontrado." };

  if (!active && target.role === "SUPER_ADMIN" && target.active) {
    const activeSupers = await countActiveSuperAdmins();
    if (activeSupers <= 1) {
      return {
        ok: false,
        error: "No puedes desactivar al último SUPER_ADMIN activo.",
      };
    }
  }

  await prisma.adminUser.update({ where: { id }, data: { active } });
  revalidatePath("/admin/users");
  return { ok: true, message: active ? "Admin activado." : "Admin desactivado." };
}

/**
 * Change an admin's role. Guards against demoting the last active SUPER_ADMIN
 * and against the owner self-demoting (which could orphan the system).
 */
export async function setAdminRole(
  id: string,
  role: AdminRole,
): Promise<AdminActionResult> {
  const me = await requireSuperAdmin();
  const parsed = roleSchema.safeParse(role);
  if (!parsed.success) return { ok: false, error: "Rol inválido." };

  if (id === me.id && role !== "SUPER_ADMIN") {
    return { ok: false, error: "No puedes quitarte tu propio rol de SUPER_ADMIN." };
  }

  const target = await prisma.adminUser.findUnique({
    where: { id },
    select: { id: true, role: true, active: true },
  });
  if (!target) return { ok: false, error: "Admin no encontrado." };

  if (
    target.role === "SUPER_ADMIN" &&
    target.active &&
    role !== "SUPER_ADMIN"
  ) {
    const activeSupers = await countActiveSuperAdmins();
    if (activeSupers <= 1) {
      return { ok: false, error: "No puedes degradar al último SUPER_ADMIN activo." };
    }
  }

  await prisma.adminUser.update({ where: { id }, data: { role } });
  revalidatePath("/admin/users");
  return { ok: true, message: "Rol actualizado." };
}

/** Reset an admin's password to a new temporary value (hashed). */
export async function resetAdminPassword(
  id: string,
  newPassword: string,
): Promise<AdminActionResult> {
  await requireSuperAdmin();
  const password = passwordSchema.safeParse(newPassword);
  if (!password.success)
    return { ok: false, error: password.error.issues[0].message };

  const target = await prisma.adminUser.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!target) return { ok: false, error: "Admin no encontrado." };

  await prisma.adminUser.update({
    where: { id },
    data: { passwordHash: await hashPassword(password.data) },
  });
  revalidatePath("/admin/users");
  return { ok: true, message: "Contraseña restablecida." };
}
