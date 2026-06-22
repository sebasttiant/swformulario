import * as React from "react";
import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Inline status banner. Used for placeholder-mapping warnings in the admin. */
export function Banner({
  variant = "warning",
  title,
  children,
  className,
}: {
  variant?: "warning" | "info";
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const Icon = variant === "warning" ? AlertTriangle : Info;
  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border p-4 text-sm",
        variant === "warning"
          ? "border-warning/30 bg-warning-soft text-warning"
          : "border-brand/20 bg-brand-soft text-ink-soft",
        className,
      )}
      role="status"
    >
      <Icon className="mt-0.5 size-5 shrink-0" />
      <div>
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="mt-0.5 text-ink-soft">{children}</div> : null}
      </div>
    </div>
  );
}
