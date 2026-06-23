import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
        ref={ref}
        className={cn(
        "flex h-11 w-full rounded-xl border border-border bg-surface/95 px-3.5 py-2 text-sm text-ink shadow-sm transition-all placeholder:text-muted focus-visible:border-brand focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";
