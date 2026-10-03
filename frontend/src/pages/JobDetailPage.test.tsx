import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listJobs } from "../lib/jobs-api";
import type { JobWithShiftCount } from "../lib/jobs-api";
import { listShifts } from "../lib/shifts-api";
import { makeShift } from "../test/fixtures";
import { JobDetailPage } from "./JobDetailPage";

vi.mock("../lib/jobs-api", () => ({ listJobs: vi.fn() }));
vi.mock("../lib/shifts-api", () => ({ listShifts: vi.fn() }));
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
};

function renderPage(path = "/jobs/job-1") {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/jobs/:id" element={<JobDetailPage />} />
      </Routes>
    </MemoryRouter>,
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

    expect(
      await screen.findByRole("heading", { level: 1, name: "Warehouse" }),
    ).toBeDefined();
    expect(screen.getByText("Part-time job, €12.00 / hour")).toBeDefined();
    expect(
      screen.getByRole("link", { name: "Back to jobs" }).getAttribute("href"),
    ).toBe("/jobs");
  });

  it("shows only this job's shifts, as Upcoming and History", async () => {
    renderPage();

    const upcoming = within(
      await screen.findByRole("region", { name: "Upcoming" }),
    );
    expect(await upcoming.findAllByRole("listitem")).toHaveLength(1);
    expect(
      within(screen.getByRole("region", { name: "History" })).getAllByRole(
        "listitem",
      ),
    ).toHaveLength(1);
    expect(listShifts).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: "job-1" }),
    );
  });

  it("is read-only: no Edit or Delete buttons on the shifts", async () => {
    renderPage();
    await screen.findByRole("region", { name: "Upcoming" });
    await screen.findAllByRole("listitem");

    expect(screen.queryByRole("button", { name: /^Edit / })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Delete / })).toBeNull();
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
});
