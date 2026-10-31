import { noVacation } from "../test/fixtures";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "../components/ui/ToastProvider";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/api-client";
import { createJob, deleteJob, listJobs, updateJob } from "../lib/jobs-api";
import type { JobWithShiftCount } from "../lib/jobs-api";
import { createLeave, listLeave } from "../lib/leave-api";
import { listShifts } from "../lib/shifts-api";
import { makeShift } from "../test/fixtures";
import { JobsPage } from "./JobsPage";

vi.mock("../lib/dates", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/dates")>()),
  localNow: () => "2026-10-07T12:00",
}));

vi.mock("../lib/jobs-api", () => ({
  listJobs: vi.fn(),
  createJob: vi.fn(),
  updateJob: vi.fn(),
  deleteJob: vi.fn(),
}));

vi.mock("../lib/leave-api", () => ({
  listLeave: vi.fn(),
  createLeave: vi.fn(),
  updateLeave: vi.fn(),
}));

vi.mock("../lib/shifts-api", () => ({ listShifts: vi.fn() }));

const warehouse: JobWithShiftCount = {
  id: "job-1",
  name: "Warehouse",
  hourlyRate: "12.00",
  type: "part_time",
  createdAt: "2026-10-01T09:00:00.000Z",
  updatedAt: "2026-10-01T09:00:00.000Z",
  shiftCount: 3,
  ...noVacation,
};

function renderPage() {
  render(
    <ToastProvider>
      <MemoryRouter>
        <JobsPage />
      </MemoryRouter>
    </ToastProvider>,
  );
}

function titleRow() {
  const heading = screen.getByRole("heading", { level: 1, name: "Jobs" });
  return within(heading.closest("header") as HTMLElement);
}

// Opens a job's "⋯" menu and picks one of its actions.
function chooseAction(jobName: string, action: string) {
  fireEvent.click(
    screen.getByRole("button", { name: `Actions for ${jobName}` }),
  );
  fireEvent.click(screen.getByRole("menuitem", { name: action }));
}

function fillInAddForm(dialog: HTMLElement) {
  fireEvent.change(within(dialog).getByLabelText("Name"), {
    target: { value: "Cafe" },
  });
  fireEvent.change(within(dialog).getByLabelText("Hourly rate"), {
    target: { value: "10,5" },
  });
  fireEvent.click(within(dialog).getByRole("radio", { name: /Mini-job/ }));
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("JobsPage", () => {
  it("shows a loading message, then the jobs", async () => {
    vi.mocked(listJobs).mockResolvedValue([warehouse]);

    renderPage();

    expect(screen.getByText("Loading your jobs…")).toBeDefined();
    const list = await within(screen.getByRole("main")).findByRole("list");
    expect(within(list).getByText("Warehouse")).toBeDefined();
    expect(within(list).getByText("€12.00")).toBeDefined();
    expect(within(list).getByText("/ hour")).toBeDefined();
  });

  it("says how many jobs there are under the title", async () => {
    vi.mocked(listJobs).mockResolvedValue([warehouse]);

    renderPage();

    expect(await titleRow().findByText("1 job")).toBeDefined();
  });

  it("floats the Add job button on a phone and leaves room under the list", async () => {
    vi.mocked(listJobs).mockResolvedValue([warehouse]);

    renderPage();

    const add = await titleRow().findByRole("button", { name: "Add job" });
    expect(add.className).toContain("max-sm:fixed");
    expect(
      screen.getByRole("main").querySelector("div.max-sm\\:pb-20"),
    ).not.toBeNull();
  });

  it("shows an empty state with one Add job button when there are no jobs", async () => {
    vi.mocked(listJobs).mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText("No jobs yet")).toBeDefined();
    expect(within(screen.getByRole("main")).queryByRole("list")).toBeNull();
    expect(screen.getAllByRole("button", { name: "Add job" })).toHaveLength(1);
    expect(titleRow().queryByRole("button")).toBeNull();
  });

  it("shows an error and no Add job button when the jobs cannot be loaded", async () => {
    vi.mocked(listJobs).mockRejectedValue(new Error("network down"));

    renderPage();

    expect(await screen.findByRole("alert")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Add job" })).toBeNull();
  });

  it("adds a job from a dialog and moves the Add job button next to the title", async () => {
    vi.mocked(listJobs).mockResolvedValue([]);
    vi.mocked(createJob).mockResolvedValue({
      id: "job-2",
      name: "Cafe",
      hourlyRate: "10.50",
      type: "mini_job",
      createdAt: "2026-10-02T09:00:00.000Z",
      updatedAt: "2026-10-02T09:00:00.000Z",
      ...noVacation,
    });
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Add job" }));

    const dialog = screen.getByRole("dialog", { name: "Add a job" });
    fillInAddForm(dialog);
    fireEvent.click(within(dialog).getByRole("button", { name: "Add job" }));

    await waitFor(() =>
      expect(createJob).toHaveBeenCalledWith({
        name: "Cafe",
        hourlyRate: "10.5",
        type: "mini_job",
        vacationHoursPerYear: null,
        vacationCarryOverHours: "0",
        vacationCarryOverYear: null,
      }),
    );
    const list = await within(screen.getByRole("main")).findByRole("list");
    expect(within(list).getByText("Cafe")).toBeDefined();
    expect(within(list).getByText("€10.50")).toBeDefined();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(titleRow().getByRole("button", { name: "Add job" })).toBeDefined();
  });

  it("opens the add dialog with an empty form every time", async () => {
    vi.mocked(listJobs).mockResolvedValue([warehouse]);
    renderPage();
    await within(screen.getByRole("main")).findByRole("list");

    fireEvent.click(titleRow().getByRole("button", { name: "Add job" }));
    const dialog = screen.getByRole("dialog", { name: "Add a job" });
    fireEvent.change(within(dialog).getByLabelText("Name"), {
      target: { value: "Half typed" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    fireEvent.click(titleRow().getByRole("button", { name: "Add job" }));

    const reopened = screen.getByRole("dialog", { name: "Add a job" });
    expect(
      (within(reopened).getByLabelText("Name") as HTMLInputElement).value,
    ).toBe("");
    expect(createJob).not.toHaveBeenCalled();
  });

  it("edits a job in a dialog and updates the list", async () => {
    vi.mocked(listJobs).mockResolvedValue([warehouse]);
    vi.mocked(updateJob).mockResolvedValue({
      id: "job-1",
      name: "Warehouse",
      hourlyRate: "13.50",
      type: "part_time",
      createdAt: warehouse.createdAt,
      updatedAt: "2026-10-03T09:00:00.000Z",
      ...noVacation,
    });
    renderPage();
    await within(screen.getByRole("main")).findByRole("list");

    chooseAction("Warehouse", "Edit job");
    const dialog = screen.getByRole("dialog", { name: "Edit job" });
    expect(
      (within(dialog).getByLabelText("Name") as HTMLInputElement).value,
    ).toBe("Warehouse");
    fireEvent.change(within(dialog).getByLabelText("Hourly rate"), {
      target: { value: "13,5" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    );

    await waitFor(() =>
      expect(updateJob).toHaveBeenCalledWith("job-1", {
        name: "Warehouse",
        hourlyRate: "13.5",
        type: "part_time",
        vacationHoursPerYear: null,
        vacationCarryOverHours: "0",
        vacationCarryOverYear: null,
      }),
    );
    await waitFor(() =>
      expect(
        within(within(screen.getByRole("main")).getByRole("list")).getByText(
          "€13.50",
        ),
      ).toBeDefined(),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("edits a job with vacation: starts on and sends the updated hours", async () => {
    const cafe: JobWithShiftCount = {
      ...warehouse,
      id: "job-2",
      name: "Cafe",
      vacationHoursPerYear: "80.00",
      vacationCarryOverHours: "8.00",
      vacationCarryOverYear: 2026,
    };
    vi.mocked(listJobs).mockResolvedValue([cafe]);
    vi.mocked(updateJob).mockResolvedValue(cafe);
    renderPage();
    await within(screen.getByRole("main")).findByRole("list");

    chooseAction("Cafe", "Edit job");
    const dialog = screen.getByRole("dialog", { name: "Edit job" });
    expect(
      (within(dialog).getByRole("switch") as HTMLInputElement).checked,
    ).toBe(true);
    expect(
      (within(dialog).getByLabelText("Hours per year") as HTMLInputElement)
        .value,
    ).toBe("80.00");
    fireEvent.change(within(dialog).getByLabelText("Hours per year"), {
      target: { value: "96" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    );

    await waitFor(() =>
      expect(updateJob).toHaveBeenCalledWith("job-2", {
        name: "Cafe",
        hourlyRate: "12.00",
        type: "part_time",
        vacationHoursPerYear: "96",
        vacationCarryOverHours: "8.00",
        vacationCarryOverYear: 2026,
      }),
    );
  });

  it("keeps the vacation values when a job with vacation is saved unchanged", async () => {
    const cafe: JobWithShiftCount = {
      ...warehouse,
      vacationHoursPerYear: "80.00",
      vacationCarryOverHours: "0.00",
      vacationCarryOverYear: null,
    };
    vi.mocked(listJobs).mockResolvedValue([cafe]);
    vi.mocked(updateJob).mockResolvedValue(cafe);
    renderPage();
    await within(screen.getByRole("main")).findByRole("list");

    chooseAction("Warehouse", "Edit job");
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Save changes",
      }),
    );

    await waitFor(() =>
      expect(updateJob).toHaveBeenCalledWith(
        "job-1",
        expect.objectContaining({
          vacationHoursPerYear: "80.00",
          vacationCarryOverHours: "0",
          vacationCarryOverYear: null,
        }),
      ),
    );
  });

  it("closes the edit dialog without saving when Cancel is pressed", async () => {
    vi.mocked(listJobs).mockResolvedValue([warehouse]);
    renderPage();
    await within(screen.getByRole("main")).findByRole("list");

    chooseAction("Warehouse", "Edit job");
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Cancel",
      }),
    );

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(updateJob).not.toHaveBeenCalled();
  });

  it("keeps the edit dialog open and shows the server's error when saving fails", async () => {
    vi.mocked(listJobs).mockResolvedValue([warehouse]);
    vi.mocked(updateJob).mockRejectedValue(
      new ApiError(400, "Validation failed", {
        hourlyRate: ["Hourly rate must be greater than 0"],
      }),
    );
    renderPage();
    await within(screen.getByRole("main")).findByRole("list");

    chooseAction("Warehouse", "Edit job");
    const dialog = screen.getByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    );

    expect(
      await within(dialog).findByText("Hourly rate must be greater than 0"),
    ).toBeDefined();
    expect(screen.getByRole("dialog", { name: "Edit job" })).toBeDefined();
  });

  it("asks for confirmation, naming the job and its shifts, before deleting", async () => {
    vi.mocked(listJobs).mockResolvedValue([warehouse]);
    renderPage();
    await within(screen.getByRole("main")).findByRole("list");

    chooseAction("Warehouse", "Delete job…");

    const dialog = screen.getByRole("dialog", { name: "Delete job?" });
    expect(within(dialog).getByText("Warehouse")).toBeDefined();
    expect(
      within(dialog).getByText("Its 3 logged shifts will be deleted too."),
    ).toBeDefined();
    expect(deleteJob).not.toHaveBeenCalled();
  });

  it("deletes the job once confirmed, and shows the empty state after the last one", async () => {
    vi.mocked(listJobs).mockResolvedValue([warehouse]);
    vi.mocked(deleteJob).mockResolvedValue(undefined);
    renderPage();
    await within(screen.getByRole("main")).findByRole("list");

    chooseAction("Warehouse", "Delete job…");
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Delete job",
      }),
    );

    await waitFor(() => expect(deleteJob).toHaveBeenCalledWith("job-1"));
    expect(await screen.findByText("No jobs yet")).toBeDefined();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("keeps the job when the delete is cancelled", async () => {
    vi.mocked(listJobs).mockResolvedValue([warehouse]);
    renderPage();
    await within(screen.getByRole("main")).findByRole("list");

    chooseAction("Warehouse", "Delete job…");
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Cancel",
      }),
    );

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(deleteJob).not.toHaveBeenCalled();
    expect(
      within(within(screen.getByRole("main")).getByRole("list")).getByText(
        "Warehouse",
      ),
    ).toBeDefined();
  });

  it("keeps the dialog open and shows the error when the delete fails", async () => {
    vi.mocked(listJobs).mockResolvedValue([warehouse]);
    vi.mocked(deleteJob).mockRejectedValue(new ApiError(404, "Job not found"));
    renderPage();
    await within(screen.getByRole("main")).findByRole("list");

    chooseAction("Warehouse", "Delete job…");
    const dialog = screen.getByRole("dialog", { name: "Delete job?" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete job" }));

    expect(await within(dialog).findByText("Job not found")).toBeDefined();
    expect(screen.getByRole("dialog", { name: "Delete job?" })).toBeDefined();
  });

  it("confirms in a message after a job is added, and when a job and its shifts are deleted", async () => {
    vi.mocked(listJobs).mockResolvedValue([warehouse]);
    vi.mocked(createJob).mockResolvedValue({
      ...warehouse,
      id: "job-2",
      name: "Cafe",
    });
    vi.mocked(deleteJob).mockResolvedValue(undefined);
    renderPage();
    await titleRow().findByRole("button", { name: "Add job" });

    fireEvent.click(titleRow().getByRole("button", { name: "Add job" }));
    const dialog = await screen.findByRole("dialog", { name: "Add a job" });
    fillInAddForm(dialog);
    fireEvent.click(within(dialog).getByRole("button", { name: "Add job" }));
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe("Job added"),
    );

    chooseAction("Warehouse", "Delete job…");
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "Delete job?" })).getByRole(
        "button",
        { name: "Delete job" },
      ),
    );
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe(
        "Warehouse and its 3 shifts deleted",
      ),
    );
  });
  it("books paid leave from the menu of a job that tracks it, and counts the removed shifts", async () => {
    const cafe: JobWithShiftCount = {
      ...warehouse,
      id: "job-2",
      name: "Cafe",
      hourlyRate: "14.00",
      vacationHoursPerYear: "80.00",
    };
    vi.mocked(listJobs).mockResolvedValue([warehouse, cafe]);
    vi.mocked(listLeave).mockResolvedValue([]);
    vi.mocked(listShifts).mockResolvedValue({
      items: [
        makeShift({ id: "s1", jobId: "job-2", date: "2026-12-22" }),
        makeShift({ id: "s2", jobId: "job-2", date: "2026-12-23" }),
      ],
      total: 2,
      limit: 500,
      offset: 0,
    });
    vi.mocked(createLeave).mockResolvedValue({
      id: "leave-1",
      jobId: "job-2",
      job: {
        id: "job-2",
        name: "Cafe",
        hourlyRate: "14.00",
        type: "part_time",
      },
      type: "paid_vacation",
      startDate: "2026-12-21",
      endDate: "2026-12-23",
      weekdays: [1, 2, 3, 4, 5],
      minutesPerDay: 240,
      notes: null,
      createdAt: "2026-10-07T09:00:00.000Z",
      updatedAt: "2026-10-07T09:00:00.000Z",
      removedShifts: 2,
    });
    renderPage();
    await within(screen.getByRole("main")).findByRole("list");

    fireEvent.click(
      screen.getByRole("button", { name: "Actions for Warehouse" }),
    );
    expect(
      screen.queryByRole("menuitem", { name: "Add paid leave" }),
    ).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Actions for Warehouse" }),
    );

    chooseAction("Cafe", "Add paid leave");
    const dialog = screen.getByRole("dialog", { name: "Add paid leave" });
    expect(
      (within(dialog).getByLabelText("Job") as HTMLSelectElement).value,
    ).toBe("job-2");
    fireEvent.change(within(dialog).getByLabelText("From"), {
      target: { value: "2026-12-21" },
    });
    fireEvent.change(within(dialog).getByLabelText("To"), {
      target: { value: "2026-12-23" },
    });
    fireEvent.click(
      await within(dialog).findByRole("checkbox", {
        name: "Remove them when I add this leave",
      }),
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Add paid leave" }),
    );

    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe(
        "Paid leave added · 2 shifts removed",
      ),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    const cafeCard = within(
      screen.getByRole("link", { name: "Cafe" }).closest("li") as HTMLElement,
    );
    expect(cafeCard.getByText("1 shift")).toBeDefined();
  });
});
