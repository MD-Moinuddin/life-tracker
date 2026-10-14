import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { LoadState } from "../../hooks/useLoad";
import type { Summary } from "../../lib/summary-api";
import { WeekGlanceCard } from "./WeekGlanceCard";

const summary: Summary = {
  from: "2026-10-05",
  to: "2026-10-11",
  jobs: [
    {
      jobId: "job-1",
      name: "Warehouse",
      type: "part_time",
      hourlyRate: "12.00",
      earnedMinutes: 480,
      plannedMinutes: 1230,
      earnedAmount: "96.00",
      plannedAmount: "252.75",
    },
  ],
  totals: {
    earnedMinutes: 480,
    plannedMinutes: 1230,
    earnedAmount: "96.00",
    plannedAmount: "252.75",
  },
};

function renderCard(state: LoadState<Summary>) {
  render(
    <MemoryRouter>
      <WeekGlanceCard state={state} />
    </MemoryRouter>,
  );
}

describe("WeekGlanceCard", () => {
  it("always has its heading", () => {
    for (const state of [
      { status: "loading" },
      { status: "error" },
      { status: "ready", data: summary },
    ] as LoadState<Summary>[]) {
      const { unmount } = render(
        <MemoryRouter>
          <WeekGlanceCard state={state} />
        </MemoryRouter>,
      );
      expect(
        screen.getByRole("heading", { level: 2, name: "Week at a glance" }),
      ).toBeDefined();
      unmount();
    }
  });

  it("says it is loading", () => {
    renderCard({ status: "loading" });

    expect(screen.getByText("Loading your week…")).toBeDefined();
  });

  it("shows a short message when the week cannot be loaded", () => {
    renderCard({ status: "error" });

    expect(screen.getByRole("alert").textContent).toBe(
      "Could not load your week. Refresh the page to try again.",
    );
  });

  it("shows the week, the planned amount and hours, and what is already worked", () => {
    renderCard({ status: "ready", data: summary });

    expect(screen.getByText("5 Oct to 11 Oct 2026")).toBeDefined();
    expect(screen.getByText("€252.75")).toBeDefined();
    expect(screen.getByText("planned this week · 20h 30m")).toBeDefined();
    expect(screen.getByText("€96.00 earned so far · 8h")).toBeDefined();
  });

  it("shows worked time as an accessible progress bar", () => {
    renderCard({ status: "ready", data: summary });

    const bar = screen.getByRole("progressbar", {
      name: "Hours worked so far",
    });
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("1230");
    expect(bar.getAttribute("aria-valuenow")).toBe("480");
    expect(bar.getAttribute("aria-valuetext")).toBe("8h of 20h 30m");
    expect(bar.firstElementChild?.getAttribute("style")).toContain("39%");
  });

  it("links to the full summary", () => {
    renderCard({ status: "ready", data: summary });

    expect(
      screen.getByRole("link", { name: "View summary" }).getAttribute("href"),
    ).toBe("/summary");
  });

  it("invites the user to add a shift when the week is empty", () => {
    renderCard({
      status: "ready",
      data: {
        ...summary,
        jobs: [],
        totals: {
          earnedMinutes: 0,
          plannedMinutes: 0,
          earnedAmount: "0.00",
          plannedAmount: "0.00",
        },
      },
    });

    expect(screen.getByText(/No shifts this week yet/)).toBeDefined();
    expect(
      screen.getByRole("link", { name: "Add a shift" }).getAttribute("href"),
    ).toBe("/shifts");
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.queryByRole("link", { name: "View summary" })).toBeNull();
  });

  it("gives the View summary link a 44px tap target", () => {
    renderCard({ status: "ready", data: summary });

    expect(
      screen.getByRole("link", { name: "View summary" }).className,
    ).toContain("min-h-11");
  });
});
