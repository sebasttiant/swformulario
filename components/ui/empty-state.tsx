import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Reusable empty state — icon in a brand circle, title, optional description and
 * CTA. Kept intentionally simple and on-brand for lists, tables and panels.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ElementType;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface/70 px-6 py-12 text-center shadow-soft",
        className,
      )}
    >
      {Icon ? (
        <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand ring-1 ring-brand/10">
          <Icon className="size-6" />
        </span>
      ) : null}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        {description ? (
          <p className="mx-auto max-w-sm text-sm leading-6 text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
