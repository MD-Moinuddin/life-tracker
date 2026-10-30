import { describe, expect, it } from "vitest";
import { JOB_COLORS, jobColor } from "./job-color";

describe("jobColor", () => {
  it("gives the same job the same colour every time", () => {
    expect(jobColor("job-abc")).toBe(jobColor("job-abc"));
  });

  it("always returns one of the palette colours", () => {
    for (const id of ["a", "b", "cl9x2k", "job-1", ""]) {
      expect(JOB_COLORS).toContain(jobColor(id));
    }
  });

  it("spreads different jobs over more than one colour", () => {
    const used = new Set(
      ["a", "b", "c", "d", "e", "f", "g", "h"].map((id) => jobColor(id)),
    );

    expect(used.size).toBeGreaterThan(1);
  });

  it("gives every colour an edge, a dot and a tint written out in full", () => {
    JOB_COLORS.forEach((color, index) => {
      const n = index + 1;
      expect(color.edge).toBe(`border-job-${n}`);
      expect(color.dot).toBe(`bg-job-${n}`);
      expect(color.tile).toBe(`bg-job-${n}/12 text-job-${n}`);
    });
  });
});
