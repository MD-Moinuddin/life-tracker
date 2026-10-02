import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listShifts } from "../lib/shifts-api";
import type { Shift } from "../lib/shifts-api";
import { makeShift } from "../test/fixtures";
import { ShiftsPage } from "./ShiftsPage";

vi.mock("../lib/shifts-api", () => ({ listShifts: vi.fn() }));
vi.mock("../lib/dates", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/dates")>()),
  localNow: () => "2026-10-07T12:00",
}));

const ended = makeShift({ id: "ended", date: "2026-10-05" });
const endedOvernight = makeShift({
  id: "ended-overnight",
  date: "2026-10-06",
  startTime: "22:00",
  endTime: "02:00",
  endDate: "2026-10-07",
  workedMinutes: 240,
});
const inProgress = makeShift({
  id: "in-progress",
  date: "2026-10-07",
  startTime: "10:00",
  endTime: "14:00",
  endDate: "2026-10-07",
  workedMinutes: 240,
});
const future = makeShift({ id: "future", date: "2026-10-09" });

function mockShifts(items: Shift[]) {
  vi.mocked(listShifts).mockResolvedValue({
    items,
    total: items.length,
    limit: 500,
    offset: 0,
  });
}

function renderPage() {
  render(
    <MemoryRouter>
      <ShiftsPage />
    </MemoryRouter>,
  );
}

function section(name: string) {
  return within(screen.getByRole("region", { name }));
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("ShiftsPage", () => {
  it("asks for shifts from yesterday on, and for the current week", async () => {
    mockShifts([]);

    renderPage();
    await screen.findByText("No upcoming shifts.");

    expect(listShifts).toHaveBeenCalledWith({ from: "2026-10-06", limit: 500 });
    expect(listShifts).toHaveBeenCalledWith({
      from: "2026-10-05",
      to: "2026-10-11",
      limit: 500,
    });
    expect(screen.getByText("5 Oct to 11 Oct 2026")).toBeDefined();
  });

  it("puts shifts that have not ended in Upcoming and the rest in History", async () => {
    mockShifts([ended, endedOvernight, inProgress, future]);

    renderPage();

    const upcomingRows = await section("Upcoming").findAllByRole("listitem");
    expect(upcomingRows).toHaveLength(2);
    expect(
      section("Upcoming").getByText("Wed 7 Oct, 10:00 to 14:00"),
    ).toBeDefined();
    expect(
      section("Upcoming").getByText("Fri 9 Oct, 09:00 to 17:00"),
    ).toBeDefined();
    expect(section("History").getAllByRole("listitem")).toHaveLength(2);
  });

  it("lists History with the newest shift first", async () => {
    mockShifts([ended, endedOvernight]);

    renderPage();

    const rows = await section("History").findAllByRole("listitem");
    expect(rows[0]?.textContent).toContain("Tue 6 Oct");
    expect(rows[1]?.textContent).toContain("Mon 5 Oct");
  });

  it("shows a message in each section when there is nothing to list", async () => {
    mockShifts([]);

    renderPage();

    expect(await screen.findByText("No upcoming shifts.")).toBeDefined();
    expect(screen.getByText("No finished shifts in this week.")).toBeDefined();
  });

  it("shows an error in each section when the shifts cannot be loaded", async () => {
    vi.mocked(listShifts).mockRejectedValue(new Error("network down"));

    renderPage();

    expect(await screen.findAllByRole("alert")).toHaveLength(2);
  });

  it("moves the History week back and forward, but not past the current week", async () => {
    mockShifts([]);
    renderPage();
    await screen.findByText("No upcoming shifts.");
    const next = screen.getByRole("button", { name: "Next week" });
    expect((next as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Previous week" }));

    expect(await screen.findByText("28 Sep to 4 Oct 2026")).toBeDefined();
    expect(listShifts).toHaveBeenCalledWith({
      from: "2026-09-28",
      to: "2026-10-04",
      limit: 500,
    });
    expect((next as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(next);

    expect(await screen.findByText("5 Oct to 11 Oct 2026")).toBeDefined();
    expect((next as HTMLButtonElement).disabled).toBe(true);
  });
});
