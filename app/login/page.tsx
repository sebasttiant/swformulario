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
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-white lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-brand/30" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="relative">
          <AbadLogo variant="dark" />
        </div>
        <div className="relative max-w-md space-y-6">
          <h1 className="text-4xl font-black leading-tight tracking-tight">
            Registro de pacientes ABAD
          </h1>
          <p className="text-base leading-7 text-white/70">
            Consola interna para capturar datos demográficos y generar archivos
            compatibles con Athenea, sin exponer herramientas administrativas al
            flujo de captura.
          </p>
          <ul className="space-y-3">
            {TRUST.map((item) => (
              <li key={item.label} className="flex items-center gap-3 text-sm text-white/80">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                  <item.icon className="size-4 text-brand" />
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
      <main className="flex items-center justify-center bg-canvas px-4 py-12 sm:px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3 text-center lg:hidden">
            <AbadLogo className="scale-110" />
            <p className="text-sm text-muted">
              Registro de pacientes · Exportación a Athenea
            </p>
          </div>
          <Card className="shadow-premium">
            <CardHeader>
              <CardTitle>Acceso interno</CardTitle>
              <CardDescription>
                Ingresa con la contraseña de administración.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
          </Card>
          <p className="mt-6 text-center text-xs text-muted">
            Acceso restringido al personal autorizado de ABAD Laboratorio.
          </p>
        </div>
      </main>
    </div>
  );
}
