import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { groupByWeek } from "../../lib/shift-groups";
import { makeShift } from "../../test/fixtures";
import { ShiftGroup } from "./ShiftGroup";

const MINI = {
  id: "job-2",
  name: "Arena",
  hourlyRate: "10.00",
  type: "mini_job",
} as const;

function renderGroup(shifts = [makeShift()]) {
  const [week] = groupByWeek(shifts);
  if (!week) throw new Error("no week");
  return render(
    <ShiftGroup title="This week" week={week} today="2026-10-01" />,
  );
}

describe("ShiftGroup", () => {
  it("shows the title and the totals of the week", () => {
    renderGroup([
      makeShift({ id: "a", workedMinutes: 480 }),
      makeShift({ id: "b", workedMinutes: 240 }),
    ]);

    expect(screen.getByRole("heading", { name: "This week" })).toBeDefined();
    expect(screen.getByText("2 shifts · 12h · €144.00")).toBeDefined();
  });

  it("lists a row per shift in one card", () => {
    const { container } = renderGroup([
      makeShift({ id: "a" }),
      makeShift({ id: "b" }),
    ]);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(container.querySelector("ul")?.className).toContain("rounded-card");
  });

  it("keeps its heading in view while scrolling", () => {
    renderGroup();

    expect(
      screen.getByRole("heading", { name: "This week" }).parentElement
        ?.className,
    ).toContain("sticky");
  });

  it("shows the job type on each row only when the week mixes types", () => {
    const { unmount } = renderGroup([makeShift({ id: "a" })]);
    expect(screen.queryByText("Part-time job")).toBeNull();
    unmount();

    renderGroup([
      makeShift({ id: "a" }),
      makeShift({ id: "b", jobId: "job-2", job: MINI }),
    ]);
    expect(screen.getByText("Part-time job")).toBeDefined();
    expect(screen.getByText("Mini-job")).toBeDefined();
  });
});
