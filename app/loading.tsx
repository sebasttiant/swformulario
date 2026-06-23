import { AbadLogo } from "@/components/brand/abad-logo";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <div className="flex flex-col items-center gap-5 rounded-3xl border border-border bg-surface p-8 text-center shadow-xl">
        <AbadLogo />
        <div className="flex items-center gap-3 text-sm font-medium text-ink-soft">
          <span className="size-2 animate-pulse rounded-full bg-brand" />
          Preparando el registro de pacientes…
        </div>
      </div>
    </div>
  );
}
