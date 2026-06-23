import { prisma } from "@/lib/db/prisma";
import { requireSuperAdmin } from "@/lib/auth/session";
import type { AdminRole } from "@prisma/client";

export interface AdminListItem {
  id: string;
  email: string;
  role: AdminRole;
  active: boolean;
  createdAt: Date;
}

/**
 * List all admin users. SUPER_ADMIN-only — the gate is enforced here (server
 * side), not merely by where the function is called from.
 */
export async function getAdmins(): Promise<AdminListItem[]> {
  await requireSuperAdmin();
  return prisma.adminUser.findMany({
    orderBy: [{ role: "desc" }, { createdAt: "asc" }],
    select: { id: true, email: true, role: true, active: true, createdAt: true },
  });
}

/** Count of currently active SUPER_ADMINs — used to prevent lock-out. */
export async function countActiveSuperAdmins(): Promise<number> {
  return prisma.adminUser.count({
    where: { role: "SUPER_ADMIN", active: true },
  });
}
