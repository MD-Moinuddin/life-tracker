import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/api-client";
import { createJob, deleteJob, listJobs, updateJob } from "../lib/jobs-api";
import type { JobWithShiftCount } from "../lib/jobs-api";
import { JobsPage } from "./JobsPage";

vi.mock("../lib/jobs-api", () => ({
  listJobs: vi.fn(),
  createJob: vi.fn(),
  updateJob: vi.fn(),
  deleteJob: vi.fn(),
}));

const warehouse: JobWithShiftCount = {
  id: "job-1",
  name: "Warehouse",
  hourlyRate: "12.00",
  type: "part_time",
  createdAt: "2026-10-01T09:00:00.000Z",
  updatedAt: "2026-10-01T09:00:00.000Z",
  shiftCount: 3,
};

function renderPage() {
  render(
    <MemoryRouter>
      <JobsPage />
    </MemoryRouter>,
  );
}

function titleRow() {
  const heading = screen.getByRole("heading", { level: 1, name: "Jobs" });
  return within(heading.parentElement as HTMLElement);
}

function fillInAddForm(dialog: HTMLElement) {
  fireEvent.change(within(dialog).getByLabelText("Name"), {
    target: { value: "Cafe" },
  });
  fireEvent.change(within(dialog).getByLabelText("Hourly rate (€)"), {
    target: { value: "10,5" },
  });
  fireEvent.change(within(dialog).getByLabelText("Type"), {
    target: { value: "mini_job" },
  });
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
    expect(within(list).getByText("€12.00 / hour")).toBeDefined();
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
      }),
    );
    const list = await within(screen.getByRole("main")).findByRole("list");
    expect(within(list).getByText("Cafe")).toBeDefined();
    expect(within(list).getByText("€10.50 / hour")).toBeDefined();
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
    });
    renderPage();
    await within(screen.getByRole("main")).findByRole("list");

    fireEvent.click(screen.getByRole("button", { name: "Edit Warehouse" }));
    const dialog = screen.getByRole("dialog", { name: "Edit job" });
    expect(
      (within(dialog).getByLabelText("Name") as HTMLInputElement).value,
    ).toBe("Warehouse");
    fireEvent.change(within(dialog).getByLabelText("Hourly rate (€)"), {
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
      }),
    );
    await waitFor(() =>
      expect(
        within(within(screen.getByRole("main")).getByRole("list")).getByText(
          "€13.50 / hour",
        ),
      ).toBeDefined(),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("closes the edit dialog without saving when Cancel is pressed", async () => {
    vi.mocked(listJobs).mockResolvedValue([warehouse]);
    renderPage();
    await within(screen.getByRole("main")).findByRole("list");

    fireEvent.click(screen.getByRole("button", { name: "Edit Warehouse" }));
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

    fireEvent.click(screen.getByRole("button", { name: "Edit Warehouse" }));
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

    fireEvent.click(screen.getByRole("button", { name: "Delete Warehouse" }));

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

    fireEvent.click(screen.getByRole("button", { name: "Delete Warehouse" }));
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

    fireEvent.click(screen.getByRole("button", { name: "Delete Warehouse" }));
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

    fireEvent.click(screen.getByRole("button", { name: "Delete Warehouse" }));
    const dialog = screen.getByRole("dialog", { name: "Delete job?" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete job" }));

    expect(await within(dialog).findByText("Job not found")).toBeDefined();
    expect(screen.getByRole("dialog", { name: "Delete job?" })).toBeDefined();
  });
});
