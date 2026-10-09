import type { ComponentProps } from "react";
import { classNames } from "../../lib/class-names";
import { Spinner } from "../Spinner";

export type ButtonVariant = "primary" | "secondary" | "danger";
export type ButtonSize = "normal" | "compact";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-control text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-on-accent shadow-card hover:bg-accent-hover",
  secondary: "border border-border-strong bg-surface text-ink hover:bg-page",
  danger: "bg-danger text-on-accent hover:bg-danger-hover",
};

const SIZES: Record<ButtonSize, string> = {
  normal: "min-h-11 px-4 py-2",
  compact: "min-h-9 px-3 py-1.5 pointer-coarse:min-h-11",
};

// Also used directly by link buttons: <Link className={buttonClassName("primary")}>.
export function buttonClassName(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "normal",
  extra?: string,
): string {
  return classNames(BASE, VARIANTS[variant], SIZES[size], extra);
}

interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "normal",
  loading = false,
  type = "button",
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={buttonClassName(variant, size, className)}
      {...props}
      aria-busy={loading || undefined}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
