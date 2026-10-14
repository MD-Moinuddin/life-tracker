import type { ComponentProps } from "react";
import { classNames } from "../../lib/class-names";

export type CardVariant = "plain" | "interactive";

const BASE = "rounded-card border border-border bg-surface shadow-card";
const INTERACTIVE = "transition-colors hover:border-accent hover:bg-page";

// The standard padding of a content card. Popovers and the login card choose
// their own on purpose.
export const CARD_PADDING = "p-5";

// Also used directly by link cards: <Link className={cardClassName("interactive", CARD_PADDING)}>.
export function cardClassName(
  variant: CardVariant = "plain",
  extra?: string,
): string {
  return classNames(BASE, variant === "interactive" && INTERACTIVE, extra);
}

interface CardProps extends ComponentProps<"div"> {
  variant?: CardVariant;
  padded?: boolean;
}

export function Card({
  variant = "plain",
  padded = false,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cardClassName(
        variant,
        classNames(padded && CARD_PADDING, className),
      )}
      {...props}
    />
  );
}
