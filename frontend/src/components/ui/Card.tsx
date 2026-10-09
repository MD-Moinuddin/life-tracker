import type { ComponentProps } from "react";
import { classNames } from "../../lib/class-names";

export type CardVariant = "plain" | "interactive";

const BASE = "rounded-card border border-border bg-surface shadow-card";
const INTERACTIVE = "transition-colors hover:border-accent hover:bg-page";

// Also used directly by link cards: <Link className={cardClassName("interactive")}>.
export function cardClassName(
  variant: CardVariant = "plain",
  extra?: string,
): string {
  return classNames(BASE, variant === "interactive" && INTERACTIVE, extra);
}

interface CardProps extends ComponentProps<"div"> {
  variant?: CardVariant;
}

export function Card({ variant = "plain", className, ...props }: CardProps) {
  return <div className={cardClassName(variant, className)} {...props} />;
}
