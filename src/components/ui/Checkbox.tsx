import { forwardRef } from "react";

type CheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
>;

// 16px, radio 5px. Marcado = fondo acento + palomacha blanca. Native input
// (appearance-none) para accesibilidad real en formularios.
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ className, ...rest }, ref) {
    return (
      <span
        className={[
          "relative inline-flex h-4 w-4 items-center justify-center",
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <input
          ref={ref}
          type="checkbox"
          className="peer absolute inset-0 m-0 cursor-pointer appearance-none rounded-[5px] border border-border-strong bg-surface transition-colors checked:border-accent checked:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          {...rest}
        />
        <svg
          viewBox="0 0 16 16"
          fill="none"
          className="pointer-events-none absolute h-3 w-3 text-surface opacity-0 peer-checked:opacity-100"
          aria-hidden="true"
        >
          <path
            d="M3.5 8.5l3 3 6-6.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  },
);
