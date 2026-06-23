import { redirect } from "next/navigation";
import { Database, LockKeyhole, ShieldCheck } from "lucide-react";
import { AbadLogo } from "@/components/brand/abad-logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/features/auth/login-form";
import { isAuthenticated } from "@/lib/auth/session";

const TRUST = [
  { icon: ShieldCheck, label: "Acceso restringido al personal autorizado." },
  { icon: Database, label: "Datos de pacientes persistidos de forma segura." },
  { icon: LockKeyhole, label: "Exportación a Athenea gestionada en backoffice." },
];

export default async function LoginPage() {
  if (await isAuthenticated()) {
    redirect("/");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel — desktop only. */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(150deg,#1e2a38_0%,#101822_100%)] p-12 text-white lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-brand/30" />
        <div className="absolute -left-20 top-10 size-72 rounded-full bg-brand/25 blur-3xl" />
        <div className="absolute -right-16 bottom-0 size-72 rounded-full bg-accent/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "linear-gradient(to bottom, black, transparent 80%)",
          }}
        />
        <div className="relative">
          <AbadLogo variant="dark" />
        </div>
        <div className="relative max-w-md space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white/85 backdrop-blur">
            <ShieldCheck className="size-3.5 text-brand" /> Consola interna
          </span>
          <h1 className="text-4xl font-black leading-tight tracking-tight text-gradient-ink">
            Registro de pacientes ABAD
          </h1>
          <p className="text-base leading-7 text-white/70">
            Consola interna para capturar datos demográficos y generar archivos
            compatibles con Athenea, sin exponer herramientas administrativas al
            flujo de captura.
          </p>
          <ul className="space-y-3">
            {TRUST.map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white/85 shadow-sm backdrop-blur"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-brand">
                  <item.icon className="size-4" />
                </span>
                {item.label}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/45">
          ABAD Laboratorio · Módulo interno de gestión de pacientes.
        </p>
      </aside>

      {/* Form side. */}
      <main className="relative flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="absolute right-0 top-0 size-72 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3 text-center lg:hidden">
            <AbadLogo className="scale-110" />
            <p className="text-sm text-muted">
              Registro de pacientes · Exportación a Athenea
            </p>
          </div>
          <Card className="shadow-premium">
            <CardHeader>
              <span className="mb-1 flex size-11 items-center justify-center rounded-2xl bg-brand-soft text-brand ring-1 ring-brand/10">
                <LockKeyhole className="size-5" />
              </span>
              <CardTitle className="text-2xl">Acceso interno</CardTitle>
              <CardDescription>
                Ingresa con la contraseña de administración.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
          </Card>
          <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
            <ShieldCheck className="size-3.5 text-accent" />
            Acceso restringido al personal autorizado de ABAD Laboratorio.
          </p>
        </div>
      </main>
    </div>
  );
}
