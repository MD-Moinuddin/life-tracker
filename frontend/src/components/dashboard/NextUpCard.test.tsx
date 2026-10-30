import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { LoadState } from "../../hooks/useLoad";
import type { Shift } from "../../lib/shifts-api";
import { makeShift } from "../../test/fixtures";
import { NextUpCard } from "./NextUpCard";

function renderCard(state: LoadState<Shift[]>, today = "2026-10-03") {
  render(
    <MemoryRouter>
      <NextUpCard state={state} today={today} />
    </MemoryRouter>,
  );
}

const ready = (shifts: Shift[]): LoadState<Shift[]> => ({
  status: "ready",
  data: shifts,
});

describe("NextUpCard", () => {
  it("shows today's shifts under a Today heading", () => {
    renderCard(
      ready([
        makeShift({ id: "a", date: "2026-10-03", startTime: "10:00" }),
        makeShift({ id: "b", date: "2026-10-03", startTime: "18:00" }),
        makeShift({ id: "c", date: "2026-10-04" }),
      ]),
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Today" }),
    ).toBeDefined();
    expect(screen.getByText("2 shifts")).toBeDefined();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("highlights the first of today's shifts as the next one", () => {
    renderCard(
      ready([
        makeShift({ id: "a", date: "2026-10-03" }),
        makeShift({ id: "b", date: "2026-10-03" }),
      ]),
    );

    const [first, second] = screen.getAllByRole("listitem");
    expect(first?.className).toContain("bg-accent-soft");
    expect(second?.className).not.toContain("bg-accent-soft");
  });

  it("shows the next shift, and when it is, if nothing is on today", () => {
    renderCard(ready([makeShift({ date: "2026-10-04" })]));

    expect(
      screen.getByRole("heading", { level: 2, name: "Next up" }),
    ).toBeDefined();
    expect(
      screen.getByText("Nothing today. Your next shift is tomorrow."),
    ).toBeDefined();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("only mentions when the next shift is when the day has a name", () => {
    renderCard(ready([makeShift({ date: "2026-12-01" })]));

    expect(screen.getByText("Nothing today.")).toBeDefined();
  });

  it("says nothing is planned when there are no upcoming shifts", () => {
    renderCard(ready([]));

    expect(screen.getByText("Nothing planned")).toBeDefined();
    expect(screen.queryByRole("listitem")).toBeNull();
  });

  it("has no actions on the rows, only a link to all shifts", () => {
    renderCard(ready([makeShift({ date: "2026-10-03" })]));

    const row = within(screen.getByRole("listitem"));
    expect(row.queryByRole("button")).toBeNull();
    expect(
      screen.getByRole("link", { name: "All shifts" }).getAttribute("href"),
    ).toBe("/shifts");
  });

  it("shows a skeleton that says it is loading", () => {
    renderCard({ status: "loading" });

    expect(screen.getByRole("status").textContent).toBe("Loading your shifts…");
  });

  it("shows a short message when the shifts cannot be loaded", () => {
    renderCard({ status: "error" });

    expect(screen.getByRole("alert").textContent).toContain(
      "Could not load your shifts",
    );
  });
});
