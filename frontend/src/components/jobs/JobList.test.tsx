import { noVacation } from "../../test/fixtures";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { jobColor } from "../../lib/job-color";
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
    ...noVacation,
  },
  {
    id: "job-2",
    name: "cafe",
    hourlyRate: "10.50",
    type: "mini_job",
    createdAt: "2026-10-02T09:00:00.000Z",
    updatedAt: "2026-10-02T09:00:00.000Z",
    shiftCount: 0,
    ...noVacation,
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

function openMenu(jobName: string) {
  fireEvent.click(
    screen.getByRole("button", { name: `Actions for ${jobName}` }),
  );
}

describe("JobList", () => {
  it("shows each job's name, type and hourly rate", () => {
    renderList();

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    const warehouse = within(screen.getAllByRole("listitem")[0] as HTMLElement);
    expect(warehouse.getByText("Warehouse")).toBeDefined();
    expect(warehouse.getByText("Part-time job")).toBeDefined();
    expect(warehouse.getByText("€12.00")).toBeDefined();
    expect(warehouse.getByText("/ hour")).toBeDefined();
    const cafe = within(screen.getAllByRole("listitem")[1] as HTMLElement);
    expect(cafe.getByText("Mini-job")).toBeDefined();
    expect(cafe.getByText("€10.50")).toBeDefined();
  });

  it("shows how many shifts each job has", () => {
    renderList();

    expect(screen.getByText("3 shifts")).toBeDefined();
    expect(screen.getByText("0 shifts")).toBeDefined();
  });

  it("links each job's name to that job's page", () => {
    renderList();

    expect(
      screen.getByRole("link", { name: "Warehouse" }).getAttribute("href"),
    ).toBe("/jobs/job-1");
    expect(
      screen.getByRole("link", { name: "cafe" }).getAttribute("href"),
    ).toBe("/jobs/job-2");
  });

  it("marks each job with its colour on the left edge and in a monogram of its initial", () => {
    renderList();

    const [first, second] = screen.getAllByRole("listitem");
    expect(first?.className).toContain(jobColor("job-1").edge);
    expect(second?.className).toContain(jobColor("job-2").edge);
    const monogram = second?.querySelector("[aria-hidden=true]");
    expect(monogram?.textContent).toBe("C");
    expect(monogram?.className).toContain(jobColor("job-2").tile);
  });

  it("has one menu per job, named after it, with Edit and Delete", () => {
    renderList();

    openMenu("Warehouse");

    expect(
      screen.getAllByRole("menuitem").map((item) => item.textContent),
    ).toEqual(["Edit job", "Delete job…"]);
  });

  it("offers Add paid leave only for a job that tracks paid vacation", () => {
    const onAddLeave = vi.fn();
    const tracked = {
      ...jobs[0],
      id: "job-3",
      name: "Bakery",
      vacationHoursPerYear: "80.00",
    } as JobWithShiftCount;
    render(
      <MemoryRouter>
        <JobList
          jobs={[...jobs, tracked]}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onAddLeave={onAddLeave}
        />
      </MemoryRouter>,
    );

    openMenu("Bakery");
    expect(
      screen.getAllByRole("menuitem").map((item) => item.textContent),
    ).toEqual(["Edit job", "Add paid leave", "Delete job…"]);
    fireEvent.click(screen.getByRole("menuitem", { name: "Add paid leave" }));
    expect(onAddLeave).toHaveBeenCalledWith(tracked);

    openMenu("Warehouse");
    expect(
      screen.getAllByRole("menuitem").map((item) => item.textContent),
    ).toEqual(["Edit job", "Delete job…"]);
  });

  it("reports which job to edit", () => {
    const onEdit = vi.fn();
    renderList({ onEdit });

    openMenu("cafe");
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit job" }));

    expect(onEdit).toHaveBeenCalledWith(jobs[1]);
  });

  it("reports which job to delete, and draws Delete as the danger action", () => {
    const onDelete = vi.fn();
    renderList({ onDelete });

    openMenu("Warehouse");
    const remove = screen.getByRole("menuitem", { name: "Delete job…" });
    expect(remove.className).toContain("text-danger");
    fireEvent.click(remove);

    expect(onDelete).toHaveBeenCalledWith(jobs[0]);
  });

  it("shows the job type as a badge in its own colour", () => {
    renderList();

    expect(screen.getByText("Part-time job").className).toContain(
      "bg-neutral-soft",
    );
    expect(screen.getByText("Mini-job").className).toContain("bg-accent-soft");
  });

  it("lays the cards out in a grid that grows with the screen", () => {
    renderList();

    const grid = screen.getByRole("list");
    expect(grid.className).toContain("sm:grid-cols-2");
    expect(grid.className).toContain("lg:grid-cols-3");
  });

  it("draws each job as a card with the shared look", () => {
    const { container } = render(
      <MemoryRouter>
        <JobList jobs={jobs} onEdit={vi.fn()} onDelete={vi.fn()} />
      </MemoryRouter>,
    );

    const card = container.querySelector("li");
    expect(card?.className).toContain("rounded-card");
    expect(card?.className).toContain("border-l-4");
    expect(container.innerHTML).not.toMatch(/slate-|indigo-|red-/);
  });
});
