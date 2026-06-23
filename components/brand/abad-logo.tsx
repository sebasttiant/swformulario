import { cn } from "@/lib/utils/cn";

/**
 * Official ABAD logo (blood-drop isotype + wordmark), served from /public.
 * - `dark` variant uses the all-white asset (for dark backgrounds, e.g. header).
 * - `light` variant uses the brand asset (red drop + charcoal wordmark).
 *
 * Source: DOCUMENTOS/logoabad.svg (official). The brand variant is derived by
 * recoloring the isotype/wordmark fills. SVGs are static — no external fonts or
 * network, so the Docker/offline build is unaffected.
 */
export function AbadLogo({
  className,
  showTagline = true,
  variant = "light",
}: {
  className?: string;
  showTagline?: boolean;
  variant?: "light" | "dark";
}) {
  const src = variant === "dark" ? "/abad-logo-white.svg" : "/abad-logo-brand.svg";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="ABAD Laboratorio"
        width={110}
        height={32}
        className="h-8 w-auto"
      />
      {showTagline ? (
        <span
          className={cn(
            "hidden border-l pl-3 text-[0.625rem] font-semibold uppercase leading-tight tracking-[0.22em] sm:inline-block",
            variant === "dark"
              ? "border-white/20 text-white/60"
              : "border-border text-muted",
          )}
        >
          Laboratorio
        </span>
      ) : null}
    </div>
  );
}
