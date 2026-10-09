import { expect, it } from "vitest";
import { LINK_CLASSES } from "./links";

it("styles text links with the accent colour", () => {
  expect(LINK_CLASSES).toContain("text-accent");
});
