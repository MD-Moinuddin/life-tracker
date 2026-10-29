import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listShifts } from "../../lib/shifts-api";
import { makeShift } from "../../test/fixtures";
import { WeekView } from "./WeekView";

vi.mock("../../lib/shifts-api", () => ({ listShifts: vi.fn() }));
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
});
