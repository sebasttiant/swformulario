import type { ReactNode } from "react";
import { AbadLogo } from "@/components/brand/abad-logo";
import { Lock, ShieldCheck } from "lucide-react";

/**
 * Chrome for the PUBLIC patient-intake flow. Unlike AppShell, it exposes NO
 * navigation, NO logout, and NO links into protected areas (dashboard, admin,
 * exports). An external, unauthenticated patient only ever sees the brand and
 * the form. The logo is deliberately NOT a link — there is nowhere public to go.
 */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="sticky top-0 z-40 border-b border-white/60 glass">
        <div className="mx-auto flex h-18 w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <AbadLogo />
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1.5 text-xs font-semibold text-ink-soft shadow-sm">
            <ShieldCheck className="size-3.5 text-accent" />
            <span className="hidden sm:inline">Formulario oficial seguro</span>
            <span className="sm:hidden">Seguro</span>
          </span>
        </div>
      </header>

      <main className="animate-fade-up mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
        {children}
      </main>

      <footer className="border-t border-white/70 bg-surface/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-2 px-4 py-7 text-center text-xs text-muted sm:px-6">
          <AbadLogo showTagline={false} className="opacity-80" />
          <p className="flex items-center gap-1.5 font-medium text-ink-soft">
            <Lock className="size-3" />
            Tus datos se transmiten de forma segura y se tratan conforme a la Ley
            1581 de 2012.
          </p>
          <p>ABAD Laboratorio · Registro de pacientes</p>
        </div>
      </footer>
    </div>
  );
}
