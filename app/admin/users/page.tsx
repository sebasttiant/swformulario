import { ShieldCheck, UsersRound } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { requireSuperAdmin } from "@/lib/auth/session";
import { getAdmins } from "@/features/admins/admin-data";
import { AdminManager } from "@/features/admins/admin-manager";

/**
 * Admin user management. SUPER_ADMIN-only — guarded server-side both here and in
 * every action/data function it calls. An ADMIN hitting this URL is redirected
 * home by requireSuperAdmin(); hiding the nav link is only cosmetic on top of
 * that real gate.
 */
export default async function AdminUsersPage() {
  const me = await requireSuperAdmin();
  const admins = await getAdmins();

  return (
    <AppShell role={me.role}>
      <div className="flex flex-col gap-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(135deg,#1e2a38,#101822)] p-6 text-white shadow-premium sm:p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-brand/25" />
          <div className="absolute -right-8 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-brand/20 blur-3xl" />
          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white/85">
              <ShieldCheck className="size-3.5 text-brand" /> Solo SUPER_ADMIN
            </span>
            <h1 className="mt-4 flex items-center gap-3 text-3xl font-black tracking-tight sm:text-4xl">
              <UsersRound className="size-8 text-brand" />
              Gestión de administradores
            </h1>
            <p className="mt-2 text-base leading-7 text-white/70">
              Crea operadores, gestiona su acceso y sus roles. Las contraseñas se
              guardan cifradas y todas las acciones se validan en el servidor.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-ink-soft">
          <Badge variant="ink">Conectado como</Badge>
          <span className="font-semibold text-ink">{me.email}</span>
          <Badge>SUPER_ADMIN</Badge>
        </div>

        <AdminManager admins={admins} currentUserId={me.id} />
      </div>
    </AppShell>
  );
}
