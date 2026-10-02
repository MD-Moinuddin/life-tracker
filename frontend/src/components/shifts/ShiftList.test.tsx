import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeShift } from "../../test/fixtures";
import { ShiftList } from "./ShiftList";

describe("ShiftList", () => {
  it("shows the job, the day and times, the worked time and the notes", () => {
    render(
      <ShiftList
        shifts={[makeShift({ workedMinutes: 450, notes: "Early start" })]}
      />,
    );

    expect(screen.getByText("Warehouse")).toBeDefined();
    expect(screen.getByText("Sat 3 Oct, 09:00 to 17:00")).toBeDefined();
    expect(screen.getByText("7h 30m")).toBeDefined();
    expect(screen.getByText("Early start")).toBeDefined();
  });

  it("marks a shift that ends the next day", () => {
    render(
      <ShiftList
        shifts={[
          makeShift({
            startTime: "22:00",
            endTime: "02:00",
            endDate: "2026-10-04",
            workedMinutes: 240,
          }),
        ]}
      />,
    );

    expect(
      screen.getByText("Sat 3 Oct, 22:00 to 02:00 (next day)"),
    ).toBeDefined();
  });

  it("shows one row per shift and no notes line when there are none", () => {
    render(
      <ShiftList
        shifts={[makeShift({ id: "a" }), makeShift({ id: "b", notes: null })]}
      />,
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.queryByText("Early start")).toBeNull();
  });
});
