import { describe, expect, it } from "vitest";
import { LANDING_CTA } from "./landing-content";

describe("LANDING_CTA", () => {
  it("has non-empty, distinct labels", () => {
    expect(LANDING_CTA.signup).not.toBe("");
    expect(LANDING_CTA.login).not.toBe("");
    expect(LANDING_CTA.signup).not.toBe(LANDING_CTA.login);
  });
});
