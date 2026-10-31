import { describe, expect, it } from "vitest";
import {
  addAmounts,
  earnedWithLeave,
  hasLeave,
  plannedWithLeave,
  rowHasLeave,
} from "./summary-totals";

const figures = {
  earnedAmount: "504.00",
  plannedAmount: "600.50",
  leave: { earnedAmount: "560.00", plannedAmount: "0.25" },
};

describe("addAmounts", () => {
  it("adds two amounts", () => {
    expect(addAmounts("504.00", "560.00")).toBe("1064.00");
  });

  it("adds in whole cents without floating-point drift", () => {
    expect(addAmounts("0.10", "0.20")).toBe("0.30");
    expect(addAmounts("0.07", "0.01")).toBe("0.08");
  });

  it("keeps two decimals", () => {
    expect(addAmounts("0", "5")).toBe("5.00");
  });
});

describe("earnedWithLeave and plannedWithLeave", () => {
  it("add the leave amount to the worked amount", () => {
    expect(earnedWithLeave(figures)).toBe("1064.00");
    expect(plannedWithLeave(figures)).toBe("600.75");
  });
});

describe("hasLeave", () => {
  const none = { earnedMinutes: 0, plannedMinutes: 0 };
  const some = { earnedMinutes: 0, plannedMinutes: 60 };

  it("is true when the totals or any job plan leave", () => {
    expect(hasLeave({ jobs: [{ leave: none }], totals: { leave: some } })).toBe(
      true,
    );
    expect(hasLeave({ jobs: [{ leave: some }], totals: { leave: none } })).toBe(
      true,
    );
  });

  it("is false when nothing is planned", () => {
    expect(hasLeave({ jobs: [{ leave: none }], totals: { leave: none } })).toBe(
      false,
    );
  });
});

describe("rowHasLeave", () => {
  it("is true when the row or totals have planned leave", () => {
    expect(rowHasLeave({ leave: { plannedMinutes: 480 } })).toBe(true);
  });

  it("is false without planned leave", () => {
    expect(rowHasLeave({ leave: { plannedMinutes: 0 } })).toBe(false);
  });
});
