import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PHONE_QUERY } from "../../lib/breakpoints";
import { listLeave } from "../../lib/leave-api";
import { listShifts } from "../../lib/shifts-api";
import { makeLeave, makeShift } from "../../test/fixtures";
import { WeekView } from "./WeekView";
import source from "./WeekView.tsx?raw";

vi.mock("../../lib/shifts-api", () => ({ listShifts: vi.fn() }));
vi.mock("../../lib/leave-api", () => ({ listLeave: vi.fn() }));
vi.mock("../../lib/dates", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../lib/dates")>()),
  localNow: () => "2026-10-07T12:00",
}));

function mockShifts(items = [makeShift({ date: "2026-10-09" })]) {
  vi.mocked(listShifts).mockResolvedValue({
    items,
    total: items.length,
    limit: 500,
    offset: 0,
  });
}

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubPhone() {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === PHONE_QUERY,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

describe("WeekView", () => {
  it("shows seven days, Monday to Sunday, with today marked", async () => {
    mockShifts([]);

    render(<WeekView version={0} onEdit={vi.fn()} />);

    const days = await screen.findAllByRole("heading", { level: 2 });
    expect(days.map((day) => day.textContent)).toEqual([
      "Mon 5 Oct",
      "Tue 6 Oct",
      "Wed 7 Oct",
      "Thu 8 Oct",
      "Fri 9 Oct",
      "Sat 10 Oct",
      "Sun 11 Oct",
    ]);
    expect(
      screen.getByText("Wed 7 Oct").closest("li")?.getAttribute("aria-current"),
    ).toBe("date");
    expect(screen.getAllByText("No shifts")).toHaveLength(7);
  });

  it("asks for the week's shifts", async () => {
    mockShifts([]);

    render(<WeekView version={0} onEdit={vi.fn()} />);
    await screen.findByText("Mon 5 Oct");

    expect(listShifts).toHaveBeenCalledWith({
      from: "2026-10-05",
      to: "2026-10-11",
      limit: 500,
    });
  });

  it("puts a shift on its day with the time and the earnings", async () => {
    mockShifts();

    render(<WeekView version={0} onEdit={vi.fn()} />);

    const friday = (await screen.findByText("Fri 9 Oct")).closest(
      "li",
    ) as HTMLElement;
    expect(within(friday).getByText("Warehouse")).toBeDefined();
    expect(within(friday).getByText("8h · €96.00")).toBeDefined();
  });

  it("sums up the week", async () => {
    mockShifts();

    render(<WeekView version={0} onEdit={vi.fn()} />);

    expect(await screen.findByText("1 shift · 8h · €96.00")).toBeDefined();
  });

  it("opens a shift for editing when its chip is pressed", async () => {
    mockShifts();
    const onEdit = vi.fn();
    render(<WeekView version={0} onEdit={onEdit} />);

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Edit Warehouse, Fri 9 Oct, 09:00 to 17:00",
      }),
    );

    expect(onEdit).toHaveBeenCalledWith(
      expect.objectContaining({ date: "2026-10-09" }),
    );
  });

  it("orders a day's shifts by start time", async () => {
    mockShifts([
      makeShift({ id: "late", date: "2026-10-09", startTime: "18:00" }),
      makeShift({ id: "early", date: "2026-10-09", startTime: "07:00" }),
    ]);

    render(<WeekView version={0} onEdit={vi.fn()} />);

    const friday = (await screen.findByText("Fri 9 Oct")).closest(
      "li",
    ) as HTMLElement;
    const chips = within(friday).getAllByRole("button");
    expect(chips[0]?.getAttribute("aria-label")).toContain("07:00");
    expect(chips[1]?.getAttribute("aria-label")).toContain("18:00");
  });

  it("moves to the neighbouring weeks", async () => {
    mockShifts([]);
    render(<WeekView version={0} onEdit={vi.fn()} />);
    await screen.findByText("Mon 5 Oct");

    fireEvent.click(screen.getByRole("button", { name: "Next week" }));
    expect(await screen.findByText("Mon 12 Oct")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Previous week" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous week" }));
    expect(await screen.findByText("Mon 28 Sep")).toBeDefined();
  });

  it("fetches again when the version changes", async () => {
    mockShifts([]);
    const { rerender } = render(<WeekView version={0} onEdit={vi.fn()} />);
    await screen.findByText("Mon 5 Oct");
    const callsBefore = vi.mocked(listShifts).mock.calls.length;

    rerender(<WeekView version={1} onEdit={vi.fn()} />);

    await vi.waitFor(() =>
      expect(vi.mocked(listShifts).mock.calls.length).toBe(callsBefore + 1),
    );
  });

  it("says so when the shifts cannot be loaded", async () => {
    vi.mocked(listShifts).mockRejectedValue(new Error("network down"));

    render(<WeekView version={0} onEdit={vi.fn()} />);

    expect(await screen.findByRole("alert")).toBeDefined();
  });

  it("puts extra controls above the week", async () => {
    mockShifts([]);

    render(
      <WeekView
        version={0}
        onEdit={vi.fn()}
        toolbarEnd={<button type="button">Extra</button>}
      />,
    );

    expect(await screen.findByRole("button", { name: "Extra" })).toBeDefined();
  });

  it("shows the day columns on a wide screen", async () => {
    mockShifts();

    render(<WeekView version={0} onEdit={vi.fn()} />);

    expect(
      await screen.findByRole("button", { name: /^Edit Warehouse, Fri 9 Oct/ }),
    ).toBeDefined();
    expect(screen.queryByRole("button", { name: /^Actions for / })).toBeNull();
  });

  it("shows a day-by-day agenda with menus on a phone", async () => {
    stubPhone();
    mockShifts();
    const onDelete = vi.fn();

    render(<WeekView version={0} onEdit={vi.fn()} onDelete={onDelete} />);

    fireEvent.click(
      await screen.findByRole("button", { name: /^Actions for Warehouse/ }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete shift…" }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("button", { name: /^Edit Warehouse/ }),
    ).toBeNull();
  });

  it("pins the toolbar to the top on a phone", async () => {
    mockShifts([]);

    render(<WeekView version={0} onEdit={vi.fn()} />);
    await screen.findByText("Mon 5 Oct");

    const toolbar = screen.getByRole("button", { name: "Previous week" })
      .parentElement?.parentElement;
    expect(toolbar?.className).toContain("max-sm:sticky");
  });

  describe("with paid leave", () => {
    const tracked = { id: "job-1", vacationHoursPerYear: "80.00" };
    const untracked = { id: "job-2", vacationHoursPerYear: null };
    // Thu 8 to Mon 12 Oct, Monday to Friday: Thu 8 and Fri 9 are in the week.
    const leave = makeLeave({
      id: "autumn",
      startDate: "2026-10-08",
      endDate: "2026-10-12",
    });

    function column(name: string) {
      return within(screen.getByText(name).closest("li") as HTMLElement);
    }

    it("asks for the week's leave once, when a job tracks vacation", async () => {
      mockShifts([]);
      vi.mocked(listLeave).mockResolvedValue([]);

      render(<WeekView version={0} jobs={[tracked]} onEdit={vi.fn()} />);
      await screen.findByText("Mon 5 Oct");

      await vi.waitFor(() =>
        expect(listLeave).toHaveBeenCalledWith({
          from: "2026-10-05",
          to: "2026-10-11",
        }),
      );
      expect(listLeave).toHaveBeenCalledTimes(1);
    });

    it("asks for no leave when no job tracks vacation", async () => {
      mockShifts([]);

      render(<WeekView version={0} jobs={[untracked]} onEdit={vi.fn()} />);
      await screen.findByText("Mon 5 Oct");

      expect(listLeave).not.toHaveBeenCalled();
      expect(screen.getAllByText("No shifts")).toHaveLength(7);
    });

    it("draws a Paid leave block in each counted day column", async () => {
      mockShifts();
      vi.mocked(listLeave).mockResolvedValue([leave]);

      render(
        <WeekView
          version={0}
          jobs={[tracked]}
          onEdit={vi.fn()}
          onEditLeave={vi.fn()}
        />,
      );

      const thursday = await vi.waitFor(() => {
        const day = column("Thu 8 Oct");
        day.getByText("Paid leave");
        return day;
      });
      expect(thursday.getByText("Cafe")).toBeDefined();
      expect(thursday.getByText("4h · €56.00")).toBeDefined();
      expect(thursday.queryByText("No shifts")).toBeNull();
      const block = thursday.getByRole("button", {
        name: "Edit paid leave, Cafe, Thu 8 Oct",
      });
      expect(block.className).toContain("bg-leave-soft");
      expect(block.className).toContain("border-leave-edge");
      expect(block.className).toContain("text-leave-ink");

      // Friday has the leave and its shift; the other days are unchanged.
      const friday = column("Fri 9 Oct");
      expect(friday.getByText("Paid leave")).toBeDefined();
      expect(friday.getByText("Warehouse")).toBeDefined();
      expect(column("Wed 7 Oct").getByText("No shifts")).toBeDefined();
      expect(column("Wed 7 Oct").queryByText("Paid leave")).toBeNull();
      expect(screen.getAllByText("Paid leave")).toHaveLength(2);
      expect(
        screen.getByText("1 shift · 8h · €96.00 · 2 days paid leave"),
      ).toBeDefined();
    });

    it("draws a plain block, not a button, without an edit handler", async () => {
      mockShifts([]);
      vi.mocked(listLeave).mockResolvedValue([leave]);

      render(<WeekView version={0} jobs={[tracked]} onEdit={vi.fn()} />);

      await vi.waitFor(() =>
        expect(column("Thu 8 Oct").getByText("Paid leave")).toBeDefined(),
      );
      expect(
        screen.queryByRole("button", { name: /^Edit paid leave/ }),
      ).toBeNull();
    });

    it("sums up a week with leave but no shifts by its days of paid leave alone", async () => {
      mockShifts([]);
      vi.mocked(listLeave).mockResolvedValue([leave]);

      render(<WeekView version={0} jobs={[tracked]} onEdit={vi.fn()} />);

      expect(await screen.findByText("2 days paid leave")).toBeDefined();
      expect(screen.queryByText(/0 shifts/)).toBeNull();
    });

    it("says planned leave in words", async () => {
      mockShifts([]);
      vi.mocked(listLeave).mockResolvedValue([leave]);

      render(<WeekView version={0} jobs={[tracked]} onEdit={vi.fn()} />);

      await vi.waitFor(() =>
        expect(column("Thu 8 Oct").getByText("Planned")).toBeDefined(),
      );
    });

    it("opens a leave block for editing", async () => {
      mockShifts([]);
      vi.mocked(listLeave).mockResolvedValue([leave]);
      const onEditLeave = vi.fn();

      render(
        <WeekView
          version={0}
          jobs={[tracked]}
          onEdit={vi.fn()}
          onEditLeave={onEditLeave}
        />,
      );
      fireEvent.click(
        await screen.findByRole("button", {
          name: "Edit paid leave, Cafe, Fri 9 Oct",
        }),
      );

      expect(onEditLeave).toHaveBeenCalledWith(leave);
    });

    it("never shows the leave of a job that stopped tracking vacation", async () => {
      mockShifts([]);
      vi.mocked(listLeave).mockResolvedValue([
        makeLeave({ id: "stopped", jobId: "job-2", startDate: "2026-10-05" }),
      ]);

      render(
        <WeekView version={0} jobs={[tracked, untracked]} onEdit={vi.fn()} />,
      );
      await vi.waitFor(() => expect(listLeave).toHaveBeenCalled());
      await screen.findByText("Mon 5 Oct");

      expect(screen.queryByText("Paid leave")).toBeNull();
      expect(screen.getAllByText("No shifts")).toHaveLength(7);
    });

    it("still shows the shifts when the leave cannot be loaded", async () => {
      mockShifts();
      vi.mocked(listLeave).mockRejectedValue(new Error("down"));

      render(<WeekView version={0} jobs={[tracked]} onEdit={vi.fn()} />);

      expect(
        await screen.findByRole("button", {
          name: /^Edit Warehouse, Fri 9 Oct/,
        }),
      ).toBeDefined();
      await vi.waitFor(() => expect(listLeave).toHaveBeenCalled());
      expect(screen.queryByRole("alert")).toBeNull();
      expect(screen.getByText("1 shift · 8h · €96.00")).toBeDefined();
    });

    it("does not ask for the leave again when only the shifts version changes", async () => {
      mockShifts([]);
      vi.mocked(listLeave).mockResolvedValue([]);
      const { rerender } = render(
        <WeekView version={0} jobs={[tracked]} onEdit={vi.fn()} />,
      );
      await vi.waitFor(() => expect(listLeave).toHaveBeenCalledTimes(1));
      const shiftsBefore = vi.mocked(listShifts).mock.calls.length;

      rerender(<WeekView version={1} jobs={[tracked]} onEdit={vi.fn()} />);

      await vi.waitFor(() =>
        expect(vi.mocked(listShifts).mock.calls.length).toBe(shiftsBefore + 1),
      );
      expect(listLeave).toHaveBeenCalledTimes(1);
    });

    it("asks for the leave of a new week, and again when the leave version changes", async () => {
      mockShifts([]);
      vi.mocked(listLeave).mockResolvedValue([]);
      const { rerender } = render(
        <WeekView version={0} jobs={[tracked]} onEdit={vi.fn()} />,
      );
      await vi.waitFor(() => expect(listLeave).toHaveBeenCalledTimes(1));

      fireEvent.click(screen.getByRole("button", { name: "Next week" }));
      await vi.waitFor(() =>
        expect(listLeave).toHaveBeenLastCalledWith({
          from: "2026-10-12",
          to: "2026-10-18",
        }),
      );
      expect(listLeave).toHaveBeenCalledTimes(2);

      rerender(
        <WeekView
          version={0}
          leaveVersion={1}
          jobs={[tracked]}
          onEdit={vi.fn()}
        />,
      );
      await vi.waitFor(() => expect(listLeave).toHaveBeenCalledTimes(3));
    });

    it("shows the leave in the phone agenda", async () => {
      stubPhone();
      mockShifts([]);
      vi.mocked(listLeave).mockResolvedValue([leave]);

      render(<WeekView version={0} jobs={[tracked]} onEdit={vi.fn()} />);

      expect(
        await screen.findAllByText("Paid leave · 4h counted"),
      ).toHaveLength(2);
    });
  });

  it("uses design tokens only, no raw palette classes", () => {
    expect(source).not.toMatch(/\b(slate|indigo|red|gray|amber|teal)-\d/);
  });
});
