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
import { createJob, listJobs, updateJob } from "../lib/jobs-api";
import type { JobWithShiftCount } from "../lib/jobs-api";
import { JobsPage } from "./JobsPage";

vi.mock("../lib/jobs-api", () => ({
  listJobs: vi.fn(),
  createJob: vi.fn(),
  updateJob: vi.fn(),
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

beforeEach(() => {
  vi.resetAllMocks();
});

describe("JobsPage", () => {
  it("shows a loading message, then the jobs and the add form", async () => {
    vi.mocked(listJobs).mockResolvedValue([warehouse]);

    renderPage();

    expect(screen.getByText("Loading jobs…")).toBeDefined();
    const list = await screen.findByRole("list");
    expect(within(list).getByText("Warehouse")).toBeDefined();
    expect(within(list).getByText("€12.00 / hour")).toBeDefined();
    expect(screen.getByLabelText("Name")).toBeDefined();
  });

  it("shows the empty state when there are no jobs", async () => {
    vi.mocked(listJobs).mockResolvedValue([]);

    renderPage();

    expect(
      await screen.findByText(
        "You have no jobs yet. Add your first one below.",
      ),
    ).toBeDefined();
  });

  it("shows an error, and no form, when the jobs cannot be loaded", async () => {
    vi.mocked(listJobs).mockRejectedValue(new Error("network down"));

    renderPage();

    expect(await screen.findByRole("alert")).toBeDefined();
    expect(screen.queryByLabelText("Name")).toBeNull();
  });

  it("adds a job to the list and clears the form", async () => {
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
    await screen.findByLabelText("Name");

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Cafe" },
    });
    fireEvent.change(screen.getByLabelText("Hourly rate (€)"), {
      target: { value: "10,5" },
    });
    fireEvent.change(screen.getByLabelText("Type"), {
      target: { value: "mini_job" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add job" }));

    await waitFor(() =>
      expect(createJob).toHaveBeenCalledWith({
        name: "Cafe",
        hourlyRate: "10.5",
        type: "mini_job",
      }),
    );
    const list = await screen.findByRole("list");
    expect(within(list).getByText("Cafe")).toBeDefined();
    expect(within(list).getByText("€10.50 / hour")).toBeDefined();
    expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe("");
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
    await screen.findByRole("list");

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
        within(screen.getByRole("list")).getByText("€13.50 / hour"),
      ).toBeDefined(),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("closes the edit dialog without saving when Cancel is pressed", async () => {
    vi.mocked(listJobs).mockResolvedValue([warehouse]);
    renderPage();
    await screen.findByRole("list");

    fireEvent.click(screen.getByRole("button", { name: "Edit Warehouse" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Cancel",
      }),
    );

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(updateJob).not.toHaveBeenCalled();
  });

  it("keeps the dialog open and shows the server's error when saving fails", async () => {
    vi.mocked(listJobs).mockResolvedValue([warehouse]);
    vi.mocked(updateJob).mockRejectedValue(
      new ApiError(400, "Validation failed", {
        hourlyRate: ["Hourly rate must be greater than 0"],
      }),
    );
    renderPage();
    await screen.findByRole("list");

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
});
