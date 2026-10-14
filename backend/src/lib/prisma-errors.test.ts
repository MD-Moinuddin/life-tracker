import { describe, expect, it } from "vitest";
import { hasPrismaCode } from "./prisma-errors";

describe("hasPrismaCode", () => {
  it("matches an error with the same code", () => {
    expect(hasPrismaCode({ code: "P2025" }, "P2025")).toBe(true);
  });

  it("does not match a different code", () => {
    expect(hasPrismaCode({ code: "P2002" }, "P2025")).toBe(false);
  });

  it("does not match values without a code", () => {
    expect(hasPrismaCode(new Error("boom"), "P2025")).toBe(false);
    expect(hasPrismaCode(null, "P2025")).toBe(false);
    expect(hasPrismaCode("P2025", "P2025")).toBe(false);
    expect(hasPrismaCode(undefined, "P2025")).toBe(false);
  });
});
