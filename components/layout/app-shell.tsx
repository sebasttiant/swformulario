import Link from "next/link";
import { AbadLogo } from "@/components/brand/abad-logo";
import { logout } from "@/features/auth/auth-actions";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/patients/new", label: "Nuevo paciente" },
  { href: "/admin", label: "Administración" },
  { href: "/exports", label: "Exportaciones" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="shrink-0">
            <AbadLogo />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-canvas hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm">
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </form>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-border px-4 py-2 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-canvas"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-muted sm:px-6">
          <p className="font-medium text-ink-soft">
            ABAD Laboratorio · Registro de pacientes
          </p>
          <p>
            Módulo interno de captura y exportación a Athenea. No realiza envío
            directo a la API (pendiente documento de autenticación JWT).
          </p>
        </div>
      </footer>
    </div>
  );
}
