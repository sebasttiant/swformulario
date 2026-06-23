import { AppShell } from "@/components/layout/app-shell";
import { PublicShell } from "@/components/layout/public-shell";
import { PatientWizard } from "@/features/patients/patient-wizard";
import { getCatalogOptions } from "@/features/catalogs/catalog-data";
import { isAuthenticated } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import { HeartPulse, ShieldCheck } from "lucide-react";

/**
 * PUBLIC patient-intake route. This page is intentionally reachable WITHOUT an
 * admin session — it is the only public write surface in the app. Behaviour
 * adapts to the session:
 *  - Authenticated operators get the full admin shell and, on save, navigate to
 *    the protected patient detail (admin mode).
 *  - Unauthenticated external patients get a focused PublicShell with no
 *    navigation into protected areas and an in-place confirmation on save.
 * All other routes remain protected by requireAdmin().
 */
export default async function NewPatientPage() {
  const isAdmin = await isAuthenticated();
  const options = await getCatalogOptions();

  if (isAdmin) {
    return (
      <AppShell variant="patient">
        <div className="flex flex-col gap-6">
          <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(251,253,255,0.85))] p-6 shadow-premium ring-1 ring-border/50 sm:p-8">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-brand/10 blur-3xl" />
            <div className="relative max-w-3xl">
              <Badge>Flujo guiado</Badge>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-ink sm:text-4xl">
                Registrar paciente
              </h1>
              <p className="mt-2 text-base leading-7 text-ink-soft">
                Completa el asistente con validación por etapas. Al guardar, los
                datos quedan persistidos y la confirmación mantiene fuera de vista
                las herramientas administrativas.
              </p>
            </div>
          </div>
          <PatientWizard options={options} mode="admin" />
        </div>
      </AppShell>
    );
  }

  return (
    <PublicShell>
      <div className="flex flex-col gap-6">
        <section className="relative overflow-hidden rounded-card border border-white/10 bg-[linear-gradient(135deg,#1e2a38,#101822)] p-6 text-white shadow-premium sm:p-9">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-brand/25" />
          <div className="absolute -right-8 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-brand/20 blur-3xl" />
          <div className="relative flex flex-col gap-5">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white/85 backdrop-blur">
              <HeartPulse className="size-3.5 text-brand" />
              Registro de paciente
            </span>
            <div className="max-w-2xl space-y-3">
              <h1 className="text-3xl font-black leading-tight tracking-tight text-gradient-ink sm:text-4xl">
                Completa tu registro en ABAD Laboratorio
              </h1>
              <p className="text-base leading-7 text-white/75">
                Solo te tomará unos minutos. Avanza paso a paso; validamos cada
                sección para que tu información quede correcta y segura.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-white/80">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-medium">
                <ShieldCheck className="size-3.5 text-accent" />
                Conexión segura
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-medium">
                Validación por pasos
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-medium">
                Habeas Data · Ley 1581
              </span>
            </div>
          </div>
        </section>
        <PatientWizard options={options} mode="public" />
      </div>
    </PublicShell>
  );
}
