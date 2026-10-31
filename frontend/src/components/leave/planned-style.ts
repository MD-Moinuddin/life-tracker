import type { CSSProperties } from "react";

// Planned leave is hatched, so it differs from taken leave without relying on
// colour. Drawn from the leave tokens.
export const PLANNED_STYLE: CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(135deg, var(--color-leave-edge) 0 4px, var(--color-leave-soft) 4px 8px)",
};
