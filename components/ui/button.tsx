import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "group/btn relative inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.98] [&_svg]:relative [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[linear-gradient(180deg,var(--color-brand),var(--color-brand-strong))] text-brand-foreground shadow-lg shadow-brand/25 hover:shadow-xl hover:shadow-brand/35 hover:-translate-y-px before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-white/15 before:opacity-0 before:transition-opacity hover:before:opacity-100",
        secondary:
          "bg-[linear-gradient(180deg,#26344a,var(--color-ink))] text-white shadow-lg shadow-ink/25 hover:-translate-y-px hover:shadow-xl hover:shadow-ink/30",
        outline:
          "border border-border bg-surface text-ink shadow-sm hover:border-brand/30 hover:bg-brand-faint hover:text-brand-strong hover:shadow-md",
        ghost: "text-ink hover:bg-brand-faint hover:text-brand-strong",
        destructive: "bg-danger text-white shadow-lg shadow-danger/20 hover:bg-danger/90 hover:shadow-xl",
        link: "text-brand underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
