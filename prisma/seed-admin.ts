import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../lib/auth/password";

/**
 * Default initial SUPER_ADMIN. Shipped as an internal default so a clean install
 * can log in immediately after `docker compose up -d --build`. This is a known
 * default credential (like many systems ship admin/admin): it MUST be changed
 * from /admin/users after install. It is stored HASHED in the DB, never shown in
 * the UI, and overridable via env for the initial creation only.
 */
const DEFAULT_SUPERADMIN_EMAIL = "admin@ilasesorias.com";
const DEFAULT_SUPERADMIN_PASSWORD = "Infoseg.00*2026*";
/** Example value shipped in env.example — treated as "not set" so it never wins. */
const PLACEHOLDER_PASSWORD = "set-a-strong-password-here";

/**
 * Ensure the initial SUPER_ADMIN exists. Create-only and idempotent:
 *  - DB empty / owner missing → create the SUPER_ADMIN (active), hashing the
 *    password. Uses SUPERADMIN_EMAIL/SUPERADMIN_PASSWORD if provided (and not the
 *    placeholder), otherwise the internal defaults above.
 *  - Owner already exists → leave it COMPLETELY untouched, so a password changed
 *    from /admin/users survives Docker restarts. The seed never overwrites or
 *    re-syncs an existing account.
 *  - Only wiping the DB/volume (`docker compose down -v`) brings back the default.
 *
 * Runs from `tsx` in dev and from a pre-bundled CJS file in the prod runner, so
 * dotenv + the Prisma client live inside main() (no top-level await). The
 * password is never logged.
 */
async function main() {
  try {
    await import("dotenv/config");
  } catch {
    // no-op: rely on process.env (Docker Compose injects it).
  }

  const envEmail = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  const envPassword = process.env.SUPERADMIN_PASSWORD;

  const email = envEmail && envEmail.length ? envEmail : DEFAULT_SUPERADMIN_EMAIL;
  const password =
    envPassword && envPassword.length && envPassword !== PLACEHOLDER_PASSWORD
      ? envPassword
      : DEFAULT_SUPERADMIN_PASSWORD;

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL ?? "",
  });
  const prisma = new PrismaClient({ adapter });

  try {
    const existing = await prisma.adminUser.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!existing) {
      await prisma.adminUser.create({
        data: {
          email,
          passwordHash: await hashPassword(password),
          role: "SUPER_ADMIN",
          active: true,
        },
      });
      console.log(`[seed-admin] Created initial SUPER_ADMIN: ${email}`);
    } else {
      console.log(
        `[seed-admin] SUPER_ADMIN already exists (${email}) — left untouched ` +
          "(manual password/role changes are preserved across restarts).",
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
