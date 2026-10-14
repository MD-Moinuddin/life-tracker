import type { ReactNode } from "react";
import { classNames } from "../../lib/class-names";

export type BadgeTone = "accent" | "success" | "neutral";

const BASE =
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";

const TONES: Record<BadgeTone, string> = {
  accent: "bg-accent-soft text-accent-ink",
  success: "bg-success-soft text-success-ink",
  neutral: "bg-neutral-soft text-ink-muted",
};

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
}

export function Badge({ tone = "neutral", children }: BadgeProps) {
  return <span className={classNames(BASE, TONES[tone])}>{children}</span>;
}
