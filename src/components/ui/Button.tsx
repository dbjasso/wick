import { forwardRef } from "react";

export type ButtonVariant = "primary" | "accent" | "ghost" | "icon";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-btn text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-text text-surface h-9 px-3.5 hover:bg-text/90 active:bg-text/95",
  accent:
    "bg-accent text-surface h-9 px-3.5 hover:bg-accent-strong active:bg-accent-strong",
  ghost: "text-text-2 h-9 px-3 hover:bg-surface-2 hover:text-text",
  icon: "text-text-2 h-8 w-8 hover:bg-surface-2 hover:text-text",
};

export function buttonStyles(
  variant: ButtonVariant = "primary",
  className?: string,
): string {
  const base = `${BASE} ${VARIANTS[variant]}`;
  return className ? `${base} ${className}` : base;
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant = "primary", className, ...rest }, ref) {
    return (
      <button ref={ref} className={buttonStyles(variant, className)} {...rest} />
    );
  },
);
