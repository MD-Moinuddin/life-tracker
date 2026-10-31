import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listJobs } from "../lib/jobs-api";
import type { JobWithShiftCount } from "../lib/jobs-api";
import { deleteLeave, listLeave, updateLeave } from "../lib/leave-api";
import type { Leave } from "../lib/leave-api";
import { listShifts } from "../lib/shifts-api";
import { ToastProvider } from "../components/ui/ToastProvider";
import { makeLeave, makeShift, noVacation } from "../test/fixtures";
import { JobDetailPage } from "./JobDetailPage";

vi.mock("../lib/jobs-api", () => ({ listJobs: vi.fn() }));
vi.mock("../lib/shifts-api", () => ({ listShifts: vi.fn() }));
vi.mock("../lib/leave-api", () => ({
  listLeave: vi.fn(),
  createLeave: vi.fn(),
  updateLeave: vi.fn(),
  deleteLeave: vi.fn(),
}));
vi.mock("../lib/dates", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/dates")>()),
  localNow: () => "2026-10-07T12:00",
}));

const warehouse: JobWithShiftCount = {
  id: "job-1",
  name: "Warehouse",
  hourlyRate: "12.00",
  type: "part_time",
  createdAt: "2026-10-01T09:00:00.000Z",
  updatedAt: "2026-10-01T09:00:00.000Z",
  shiftCount: 2,
  ...noVacation,
};

const cafe: JobWithShiftCount = {
  ...warehouse,
  name: "Cafe",
  hourlyRate: "14.00",
  vacationHoursPerYear: "80.00",
};
const march = makeLeave({ id: "mar" });
const august = makeLeave({
  id: "aug",
  startDate: "2026-08-03",
  endDate: "2026-08-14",
});
const december = makeLeave({
  id: "dec",
  startDate: "2026-12-28",
  endDate: "2026-12-29",
});
const otherJob = makeLeave({
  id: "other",
  jobId: "job-2",
  startDate: "2026-05-04",
  endDate: "2026-05-05",
});

function renderPage(path = "/jobs/job-1") {
  render(
    <ToastProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/jobs/:id" element={<JobDetailPage />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(listJobs).mockResolvedValue([warehouse]);
  vi.mocked(listShifts).mockResolvedValue({
    items: [
      makeShift({ id: "ended", date: "2026-10-05" }),
      makeShift({ id: "future", date: "2026-10-09" }),
    ],
    total: 2,
    limit: 500,
    offset: 0,
  });
});

describe("JobDetailPage", () => {
  it("shows the job's name, type and rate, with a link back to the jobs", async () => {
    renderPage();

    const heading = await screen.findByRole("heading", {
      level: 1,
      name: "Warehouse",
    });
    expect(heading).toBeDefined();
    const header = within(heading.closest("header") as HTMLElement);
    expect(header.getByText("Part-time job")).toBeDefined();
    expect(header.getByText("€12.00 / hour")).toBeDefined();
    expect(
      screen.getByRole("link", { name: "Back to jobs" }).getAttribute("href"),
    ).toBe("/jobs");
  });

  it("shows the type as a coloured badge and keeps the heading to the name only", async () => {
    renderPage();

    const heading = await screen.findByRole("heading", { level: 1 });
    expect(heading.textContent).toBe("Warehouse");
    expect(
      within(heading.closest("header") as HTMLElement).getByText(
        "Part-time job",
      ).className,
    ).toContain("bg-neutral-soft");
  });

  it("has a back link that is a comfortable tap target, and a header with no raw colours", async () => {
    renderPage();

    const heading = await screen.findByRole("heading", {
      level: 1,
      name: "Warehouse",
    });
    expect(
      screen.getByRole("link", { name: "Back to jobs" }).className,
    ).toContain("min-h-11");
    expect(heading.closest("header")?.outerHTML).not.toMatch(
      /slate-|indigo-|red-/,
    );
  });

  it("shows only this job's shifts, as Upcoming and History", async () => {
    renderPage();

    const upcoming = within(
      await screen.findByRole("region", { name: "Upcoming shifts" }),
    );
    expect(await upcoming.findAllByRole("listitem")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "History" }));

    expect(
      within(
        screen.getByRole("region", { name: "Shift history" }),
      ).getAllByRole("listitem"),
    ).toHaveLength(1);
    expect(listShifts).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: "job-1" }),
    );
  });

  it("is read-only: no action menu on the shifts", async () => {
    renderPage();
    const upcoming = within(
      await screen.findByRole("region", { name: "Upcoming shifts" }),
    );
    const rows = await upcoming.findAllByRole("listitem");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.textContent).toContain("09:00");

    expect(screen.queryByRole("button", { name: /^Actions for / })).toBeNull();
  });

  it("explains that the job does not exist, and asks for no shifts", async () => {
    renderPage("/jobs/unknown");

    expect(
      await screen.findByText("This job does not exist, or it was deleted."),
    ).toBeDefined();
    expect(listShifts).not.toHaveBeenCalled();
  });

  it("shows an error when the job cannot be loaded", async () => {
    vi.mocked(listJobs).mockRejectedValue(new Error("network down"));

    renderPage();

    expect(await screen.findByRole("alert")).toBeDefined();
    expect(listShifts).not.toHaveBeenCalled();
  });

  it("shows no vacation section and asks for no leave when the job does not track it", async () => {
    renderPage();

    await screen.findByRole("heading", { level: 1, name: "Warehouse" });
    expect(screen.queryByRole("heading", { name: /Paid vacation/ })).toBeNull();
    expect(listLeave).not.toHaveBeenCalled();
  });
});

describe("JobDetailPage paid vacation", () => {
  beforeEach(() => {
    vi.mocked(listJobs).mockResolvedValue([cafe]);
    vi.mocked(listLeave).mockResolvedValue([march, august, december, otherJob]);
  });

  async function section() {
    await screen.findByRole("heading", {
      level: 2,
      name: "Paid vacation 2026",
    });
    await screen.findByRole("region", { name: "Paid vacation balance" });
    return within(screen.getByRole("region", { name: "Paid vacation 2026" }));
  }

  function card() {
    return within(
      screen.getByRole("region", { name: "Paid vacation balance" }),
    );
  }

  it("asks for the year's leave and shows the balance of this job only", async () => {
    renderPage();

    const vacation = await section();
    expect(listLeave).toHaveBeenCalledWith({
      from: "2026-01-01",
      to: "2026-12-31",
    });
    expect(card().getByText("Taken").parentElement?.textContent).toContain(
      "60h",
    );
    expect(card().getByText("Planned").parentElement?.textContent).toContain(
      "8h",
    );
    expect(card().getByText("Left").parentElement?.textContent).toContain(
      "12h",
    );
    expect(
      vacation.getByRole("img", { name: "12h left of 80h" }),
    ).toBeDefined();
    expect(vacation.queryByText("4 May to 5 May")).toBeNull();
  });

  it("shows a negative balance in words", async () => {
    vi.mocked(listJobs).mockResolvedValue([
      { ...cafe, vacationHoursPerYear: "60.00" },
    ]);
    renderPage();

    const vacation = await section();
    expect(card().getByText("Left").parentElement?.textContent).toContain(
      "−8h",
    );
    expect(vacation.getByText("You are over by 8h.")).toBeDefined();
  });

  it("shows the carry-over line for the shown year", async () => {
    vi.mocked(listJobs).mockResolvedValue([
      { ...cafe, vacationCarryOverHours: "8.00", vacationCarryOverYear: 2026 },
    ]);
    renderPage();

    const vacation = await section();
    expect(
      vacation.getByText("8h from last year expire on 31 March."),
    ).toBeDefined();
  });

  it("lists planned and taken leave", async () => {
    renderPage();

    const vacation = await section();
    expect(vacation.getByRole("region", { name: "Planned" })).toBeDefined();
    expect(vacation.getByRole("region", { name: "Taken" })).toBeDefined();
    expect(vacation.getAllByRole("listitem")).toHaveLength(3);
  });

  // The leave of the whole job (no range) decides which years can be chosen;
  // a range asks for one year.
  function leaveByCall(all: Leave[]) {
    vi.mocked(listLeave).mockImplementation(async (params) =>
      params?.jobId ? all : [march, august, december, otherJob],
    );
  }
  const in2027 = makeLeave({
    id: "y27",
    startDate: "2027-02-01",
    endDate: "2027-02-02",
  });
  const in2024 = makeLeave({
    id: "y24",
    startDate: "2024-02-05",
    endDate: "2024-02-06",
  });

  it("shows no year switch when all the leave is in the current year", async () => {
    leaveByCall([march, august]);
    renderPage();
    await section();

    expect(screen.queryByRole("group", { name: "Year" })).toBeNull();
  });

  it("ignores the leave of other jobs when deciding on the year switch", async () => {
    leaveByCall([march, { ...in2027, jobId: "job-2" }]);
    renderPage();
    await section();

    expect(screen.queryByRole("group", { name: "Year" })).toBeNull();
  });

  it("loads the chosen year", async () => {
    leaveByCall([march, in2027]);
    renderPage();
    await section();

    fireEvent.click(await screen.findByRole("button", { name: "2027" }));

    await screen.findByRole("heading", {
      level: 2,
      name: "Paid vacation 2027",
    });
    expect(listLeave).toHaveBeenCalledWith({
      from: "2027-01-01",
      to: "2027-12-31",
    });
    expect(
      screen.getByRole("button", { name: "2027" }).getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("reaches leave from years back", async () => {
    leaveByCall([in2024, march]);
    renderPage();
    await section();

    fireEvent.click(await screen.findByRole("button", { name: "2024" }));

    await screen.findByRole("heading", {
      level: 2,
      name: "Paid vacation 2024",
    });
    expect(listLeave).toHaveBeenCalledWith({
      from: "2024-01-01",
      to: "2024-12-31",
    });
  });

  it("hides the year switch, and keeps the section, when the years cannot be loaded", async () => {
    vi.mocked(listLeave).mockImplementation(async (params) => {
      if (params?.jobId) throw new Error("down");
      return [march];
    });
    renderPage();
    await section();

    expect(screen.queryByRole("group", { name: "Year" })).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows only this job's leave in its shift lists, read-only", async () => {
    const otherTracked: JobWithShiftCount = {
      ...cafe,
      id: "job-2",
      name: "Bar",
    };
    vi.mocked(listJobs).mockResolvedValue([cafe, otherTracked]);
    vi.mocked(listLeave).mockResolvedValue([
      december,
      makeLeave({
        id: "bar-leave",
        jobId: "job-2",
        job: {
          id: "job-2",
          name: "Bar",
          hourlyRate: "14.00",
          type: "part_time",
        },
        startDate: "2026-11-02",
        endDate: "2026-11-03",
      }),
    ]);
    renderPage();

    const upcoming = within(
      await screen.findByRole("region", { name: "Upcoming shifts" }),
    );
    expect(await upcoming.findByText("Paid leave · Cafe")).toBeDefined();
    expect(upcoming.getByText("28 Dec to 29 Dec")).toBeDefined();
    expect(upcoming.queryByText("Paid leave · Bar")).toBeNull();
    expect(upcoming.getAllByText(/09:00/).length).toBeGreaterThan(0);
    expect(
      upcoming.queryByRole("button", { name: /^Actions for / }),
    ).toBeNull();
    expect(listLeave).toHaveBeenCalledWith({
      from: "2026-10-07",
      jobId: "job-1",
    });
  });

  it("reloads its shift lists after leave is deleted in the vacation section", async () => {
    vi.mocked(deleteLeave).mockResolvedValue(undefined);
    renderPage();
    await section();
    const before = vi.mocked(listShifts).mock.calls.length;

    fireEvent.click(
      screen.getByRole("button", {
        name: "Actions for paid leave 9 Mar to 13 Mar",
      }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete…" }));
    const dialog = await screen.findByRole("dialog", {
      name: "Delete paid leave?",
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Delete paid leave" }),
    );

    await waitFor(() => expect(deleteLeave).toHaveBeenCalledWith("mar"));
    await waitFor(() =>
      expect(vi.mocked(listShifts).mock.calls.length).toBeGreaterThan(before),
    );
  });

  it("explains an empty year", async () => {
    vi.mocked(listLeave).mockResolvedValue([]);
    renderPage();

    await section();
    expect(screen.getByText("No paid leave in 2026 yet")).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Add paid leave" }),
    ).toBeDefined();
  });

  it("opens the add dialog for this job", async () => {
    renderPage();
    await section();

    fireEvent.click(screen.getByRole("button", { name: "Add paid leave" }));

    const dialog = await screen.findByRole("dialog", {
      name: "Add paid leave",
    });
    expect(
      (within(dialog).getByLabelText("Job") as HTMLSelectElement).value,
    ).toBe("job-1");
  });

  it("edits a leave entry and reloads", async () => {
    vi.mocked(updateLeave).mockResolvedValue(march);
    renderPage();
    await section();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Actions for paid leave 9 Mar to 13 Mar",
      }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    const dialog = await screen.findByRole("dialog", {
      name: "Edit paid leave",
    });
    fireEvent.click(within(dialog).getByRole("button", { name: /Save/ }));

    await waitFor(() =>
      expect(updateLeave).toHaveBeenCalledWith("mar", expect.anything()),
    );
    await waitFor(() =>
      expect(vi.mocked(listLeave).mock.calls.length).toBeGreaterThan(1),
    );
  });

  it("deletes after confirming, then reloads", async () => {
    vi.mocked(deleteLeave).mockResolvedValue(undefined);
    renderPage();
    await section();
    const before = vi.mocked(listLeave).mock.calls.length;

    fireEvent.click(
      screen.getByRole("button", {
        name: "Actions for paid leave 9 Mar to 13 Mar",
      }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete…" }));
    const dialog = await screen.findByRole("dialog", {
      name: "Delete paid leave?",
    });
    expect(within(dialog).getByText("9 Mar to 13 Mar")).toBeDefined();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Delete paid leave" }),
    );

    await waitFor(() => expect(deleteLeave).toHaveBeenCalledWith("mar"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await screen.findByText("Paid leave deleted");
    await waitFor(() =>
      expect(vi.mocked(listLeave).mock.calls.length).toBeGreaterThan(before),
    );
  });

  it("keeps the leave when the delete is cancelled", async () => {
    renderPage();
    await section();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Actions for paid leave 9 Mar to 13 Mar",
      }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete…" }));
    const dialog = await screen.findByRole("dialog", {
      name: "Delete paid leave?",
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(deleteLeave).not.toHaveBeenCalled();
  });

  it("shows a failed delete inside the dialog", async () => {
    vi.mocked(deleteLeave).mockRejectedValue(new Error("down"));
    renderPage();
    await section();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Actions for paid leave 9 Mar to 13 Mar",
      }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete…" }));
    const dialog = await screen.findByRole("dialog", {
      name: "Delete paid leave?",
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Delete paid leave" }),
    );

    expect(await within(dialog).findByRole("alert")).toBeDefined();
  });

  it("keeps the page working when the leave cannot be loaded, and retries", async () => {
    vi.mocked(listLeave).mockRejectedValueOnce(new Error("down"));
    renderPage();

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Could not load paid leave");
    expect(
      screen.getByRole("heading", { level: 1, name: "Cafe" }),
    ).toBeDefined();
    expect(
      await screen.findByRole("region", { name: "Upcoming shifts" }),
    ).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await screen.findByRole("region", { name: "Paid vacation balance" });
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
