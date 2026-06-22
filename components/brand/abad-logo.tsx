import { cn } from "@/lib/utils/cn";

/**
 * ABAD wordmark with the signature blood-drop isotype.
 *
 * NOTE (handoff): this is a faithful semantic recreation, not the exact official
 * asset. If the licensed SVG from abadlaboratorio.com becomes available, drop it
 * into /public and swap this component.
 */
export function AbadLogo({
  className,
  showTagline = true,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 24 32"
        className="h-8 w-6"
        role="img"
        aria-label="ABAD Laboratorio"
      >
        <path
          d="M12 1C12 1 2 13 2 20a10 10 0 0 0 20 0C22 13 12 1 12 1Z"
          fill="var(--color-brand)"
        />
        <path
          d="M8 19a4 4 0 0 0 4 4"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
      <div className="leading-tight">
        <div className="text-xl font-extrabold tracking-tight text-ink">
          ABAD
        </div>
        {showTagline ? (
          <div className="text-[0.625rem] font-semibold uppercase tracking-[0.25em] text-muted">
            Laboratorio
          </div>
        ) : null}
      </div>
    </div>
  );
}
