import { expect, it } from "vitest";
import { LINK_CLASSES } from "./links";

it("styles text links with the accent colour", () => {
  expect(LINK_CLASSES).toContain("text-accent");
});

it("sets no font size, so a link follows the text around it", () => {
  expect(LINK_CLASSES).not.toMatch(/\btext-(xs|sm|base|lg|xl)\b/);
});
