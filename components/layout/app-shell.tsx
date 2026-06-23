import Link from "next/link";
import type { ReactNode } from "react";
import { AbadLogo } from "@/components/brand/abad-logo";
import { logout } from "@/features/auth/auth-actions";
import { Button } from "@/components/ui/button";
import { Activity, LogOut, ShieldCheck } from "lucide-react";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/patients/new", label: "Nuevo paciente" },
  { href: "/admin", label: "Administración" },
  { href: "/exports", label: "Exportaciones" },
] as const;

const APP_SHELL_VARIANT = {
  ADMIN: "admin",
  PATIENT: "patient",
} as const;

type AppShellVariant = (typeof APP_SHELL_VARIANT)[keyof typeof APP_SHELL_VARIANT];

interface AppShellProps {
  children?: ReactNode;
  variant?: AppShellVariant;
}

export function getAppShellNavItems(variant: AppShellVariant = APP_SHELL_VARIANT.ADMIN) {
  if (variant === APP_SHELL_VARIANT.PATIENT) {
    return NAV.filter((item) => item.href !== "/admin" && item.href !== "/exports");
  }

  return NAV;
}

export function AppShell({ children, variant = APP_SHELL_VARIANT.ADMIN }: AppShellProps) {
  const navItems = getAppShellNavItems(variant);
  const isPatientFlow = variant === APP_SHELL_VARIANT.PATIENT;

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/95 text-white shadow-premium backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="shrink-0">
              <AbadLogo variant="dark" />
            </Link>
            <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/75 lg:inline-flex">
              <ShieldCheck className="size-3.5 text-brand" />
              Consola segura
            </span>
          </div>
          <nav className="hidden items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-3 py-2 text-sm font-medium text-white/75 transition-all hover:bg-white/10 hover:text-white hover:shadow-sm"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 text-xs font-medium text-white/60 sm:inline-flex">
              <Activity className="size-3.5 text-accent" />
              Operativo
            </span>
            <form action={logout}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </form>
          </div>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-white/10 px-4 py-2 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-white/75 hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="animate-fade-up mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        {children}
      </main>
      <footer className="border-t border-white/70 bg-surface/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 py-6 text-xs text-muted sm:px-6 lg:px-8">
          <p className="font-medium text-ink-soft">
            ABAD Laboratorio · Registro de pacientes
          </p>
          {isPatientFlow ? (
            <p>Módulo interno de captura y gestión segura de pacientes.</p>
          ) : (
            <p>
              Módulo interno de captura y exportación a Athenea. No realiza envío
              directo a la API (pendiente documento de autenticación JWT).
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}
