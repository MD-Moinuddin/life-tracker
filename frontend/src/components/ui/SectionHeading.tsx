import type { ReactNode } from "react";
import { classNames } from "../../lib/class-names";

interface SectionHeadingProps {
  id?: string;
  className?: string;
  children: ReactNode;
}

// The look of a page section's heading. It sets no margins: callers add the
// spacing that fits where they use it.
export function SectionHeading({
  id,
  className,
  children,
}: SectionHeadingProps) {
  return (
    <h2
      id={id}
      className={classNames("text-section font-semibold text-ink", className)}
    >
      {children}
    </h2>
  );
}
