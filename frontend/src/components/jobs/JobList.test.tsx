import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { JobWithShiftCount } from "../../lib/jobs-api";
import { JobList } from "./JobList";

const jobs: JobWithShiftCount[] = [
  {
    id: "job-1",
    name: "Warehouse",
    hourlyRate: "12.00",
    type: "part_time",
    createdAt: "2026-10-01T09:00:00.000Z",
    updatedAt: "2026-10-01T09:00:00.000Z",
    shiftCount: 3,
  },
  {
    id: "job-2",
    name: "Cafe",
    hourlyRate: "10.50",
    type: "mini_job",
    createdAt: "2026-10-02T09:00:00.000Z",
    updatedAt: "2026-10-02T09:00:00.000Z",
    shiftCount: 0,
  },
];

describe("JobList", () => {
  it("shows each job's name, type and hourly rate", () => {
    render(<JobList jobs={jobs} onEdit={vi.fn()} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Warehouse")).toBeDefined();
    expect(screen.getByText("Part-time job")).toBeDefined();
    expect(screen.getByText("€12.00 / hour")).toBeDefined();
    expect(screen.getByText("Cafe")).toBeDefined();
    expect(screen.getByText("Mini-job")).toBeDefined();
    expect(screen.getByText("€10.50 / hour")).toBeDefined();
  });

  it("shows a friendly message when there are no jobs", () => {
    render(<JobList jobs={[]} onEdit={vi.fn()} />);

    expect(
      screen.getByText("You have no jobs yet. Add your first one below."),
    ).toBeDefined();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("reports which job to edit, with a button named after the job", () => {
    const onEdit = vi.fn();
    render(<JobList jobs={jobs} onEdit={onEdit} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit Cafe" }));

    expect(onEdit).toHaveBeenCalledWith(jobs[1]);
  });
});
