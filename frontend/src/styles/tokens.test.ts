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
  ["accent-hover", "surface"],
  ["accent-hover", "page"],
  ["accent-ink", "accent-soft"],
  ["success", "surface"],
  ["success-ink", "success-soft"],
  ["warning-ink", "warning-soft"],
  ["danger", "surface"],
  ["danger", "page"],
  ["danger", "danger-soft"],
  ["danger-ink", "danger-soft"],
  ["leave-ink", "leave-soft"],
];

// [UI component colour, neighbouring colour]. Boundaries and indicators of
// controls need 3:1 (WCAG 1.4.11 non-text contrast).
const NON_TEXT_PAIRS: [string, string][] = [
  ["control-border", "surface"],
  ["control-border", "page"],
  ["control-border", "neutral-soft"],
  ["accent", "page"],
  ["accent", "surface"],
  ["accent", "neutral-soft"],
  ["warning", "neutral-soft"],
  ["warning", "surface"],
  ["danger", "surface"],
  ["danger", "page"],
  ["job-1", "surface"],
  ["job-2", "surface"],
  ["job-3", "surface"],
  ["job-4", "surface"],
  ["job-5", "surface"],
  ["job-6", "surface"],
  ["leave", "surface"],
  ["leave-edge", "surface"],
];

describe("design tokens", () => {
  it.each(TEXT_PAIRS)("%s text on %s meets WCAG AA (4.5:1)", (text, bg) => {
    expect(contrastRatio(color(text), color(bg))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(NON_TEXT_PAIRS)(
    "%s against %s meets WCAG non-text contrast (3:1)",
    (component, neighbour) => {
      expect(
        contrastRatio(color(component), color(neighbour)),
      ).toBeGreaterThanOrEqual(3);
    },
  );

  it("finds every token it is asked about", () => {
    expect(() => color("does-not-exist")).toThrow(/not found/);
  });
});

describe("light colour scheme", () => {
  const indexCss = readFileSync(join(__dirname, "..", "index.css"), "utf8");
  const indexHtml = readFileSync(
    join(__dirname, "..", "..", "index.html"),
    "utf8",
  );

  it("tells the browser the app is light, so its own controls are drawn light", () => {
    expect(indexCss).toMatch(/:root\s*{\s*color-scheme:\s*light;/);
  });

  it("says so before the stylesheet loads, so nothing flashes dark", () => {
    expect(indexHtml).toContain('<meta name="color-scheme" content="light" />');
  });
});
