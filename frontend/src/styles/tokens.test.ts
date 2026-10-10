import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "../lib/contrast.ts";

// Read from disk rather than `?raw`: Tailwind's Vite plugin compiles the
// stylesheet and drops unused @theme variables, which left the import empty.
const tokensCss = readFileSync(join(__dirname, "tokens.css"), "utf8");

function color(name: string): string {
  const match = new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`).exec(
    tokensCss,
  );
  if (!match?.[1]) {
    throw new Error(`Token --color-${name} not found in tokens.css`);
  }
  return match[1];
}

// [text colour, background colour] for every pair the UI renders.
const TEXT_PAIRS: [string, string][] = [
  ["ink", "page"],
  ["ink", "surface"],
  ["ink", "neutral-soft"],
  ["ink-muted", "page"],
  ["ink-muted", "surface"],
  ["ink-muted", "neutral-soft"],
  ["on-accent", "accent"],
  ["on-accent", "accent-hover"],
  ["on-accent", "danger"],
  ["on-accent", "danger-hover"],
  ["accent", "surface"],
  ["accent", "page"],
  ["accent", "accent-soft"],
  ["accent-ink", "accent-soft"],
  ["success", "surface"],
  ["success-ink", "success-soft"],
  ["warning-ink", "warning-soft"],
  ["danger", "surface"],
  ["danger", "page"],
  ["danger-ink", "danger-soft"],
];

describe("design tokens", () => {
  it.each(TEXT_PAIRS)("%s text on %s meets WCAG AA (4.5:1)", (text, bg) => {
    expect(contrastRatio(color(text), color(bg))).toBeGreaterThanOrEqual(4.5);
  });

  it("finds every token it is asked about", () => {
    expect(() => color("does-not-exist")).toThrow(/not found/);
  });
});
