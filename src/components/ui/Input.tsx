import { forwardRef } from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, invalid, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={[
          "h-9 w-full rounded-btn border bg-surface px-3 text-sm text-text placeholder:text-text-3",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:border-accent",
          invalid ? "border-[#FECDCA]" : "border-border-strong",
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      />
    );
  },
);
