import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
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

function renderList(
  handlers: { onEdit?: () => void; onDelete?: () => void } = {},
) {
  render(
    <MemoryRouter>
      <JobList
        jobs={jobs}
        onEdit={handlers.onEdit ?? vi.fn()}
        onDelete={handlers.onDelete ?? vi.fn()}
      />
    </MemoryRouter>,
  );
}

describe("JobList", () => {
  it("shows each job's name, type and hourly rate", () => {
    renderList();

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Warehouse")).toBeDefined();
    expect(screen.getByText("Part-time job")).toBeDefined();
    expect(screen.getByText("€12.00 / hour")).toBeDefined();
    expect(screen.getByText("Cafe")).toBeDefined();
    expect(screen.getByText("Mini-job")).toBeDefined();
    expect(screen.getByText("€10.50 / hour")).toBeDefined();
  });

  it("hides the separator between the rate and the shift count from screen readers", () => {
    renderList();

    const paragraph = screen.getByText("3 shifts").closest("p");
    const separator = Array.from(
      paragraph?.querySelectorAll("span") ?? [],
    ).find((span) => span.textContent?.includes("·"));
    expect(separator?.getAttribute("aria-hidden")).toBe("true");
  });

  it("links each job's name to that job's page", () => {
    renderList();

    expect(
      screen.getByRole("link", { name: "Warehouse" }).getAttribute("href"),
    ).toBe("/jobs/job-1");
    expect(
      screen.getByRole("link", { name: "Cafe" }).getAttribute("href"),
    ).toBe("/jobs/job-2");
  });

  it("reports which job to edit, with a button named after the job", () => {
    const onEdit = vi.fn();
    renderList({ onEdit });

    fireEvent.click(screen.getByRole("button", { name: "Edit Cafe" }));

    expect(onEdit).toHaveBeenCalledWith(jobs[1]);
  });

  it("reports which job to delete, with a button named after the job", () => {
    const onDelete = vi.fn();
    renderList({ onDelete });

    fireEvent.click(screen.getByRole("button", { name: "Delete Warehouse" }));

    expect(onDelete).toHaveBeenCalledWith(jobs[0]);
  });

  it("shows how many shifts each job has", () => {
    renderList();

    expect(screen.getByText("3 shifts")).toBeDefined();
    expect(screen.getByText("0 shifts")).toBeDefined();
  });

  it("shows the job type as a badge in its own colour", () => {
    renderList();

    expect(screen.getByText("Part-time job").className).toContain(
      "bg-neutral-soft",
    );
    expect(screen.getByText("Mini-job").className).toContain("bg-accent-soft");
  });

  it("makes Delete the quiet danger button and Edit the plain one", () => {
    renderList();

    expect(
      screen.getByRole("button", { name: "Delete Warehouse" }).className,
    ).toContain("text-danger");
    expect(
      screen.getByRole("button", { name: "Edit Warehouse" }).className,
    ).not.toContain("text-danger");
  });

  it("draws each job as a card with the shared look", () => {
    const { container } = render(
      <MemoryRouter>
        <JobList jobs={jobs} onEdit={vi.fn()} onDelete={vi.fn()} />
      </MemoryRouter>,
    );

    const card = container.querySelector("li");
    expect(card?.className).toContain("rounded-card");
    expect(card?.className).toContain("p-5");
    expect(container.innerHTML).not.toMatch(/slate-|indigo-|red-/);
  });
});
