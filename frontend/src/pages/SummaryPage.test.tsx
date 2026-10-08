import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSummary } from "../lib/summary-api";
import type { Summary } from "../lib/summary-api";
import { SummaryPage } from "./SummaryPage";

vi.mock("../lib/summary-api", () => ({ getSummary: vi.fn() }));
vi.mock("../lib/dates", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/dates")>()),
  localNow: () => "2026-10-07T12:00",
}));

const summary: Summary = {
  from: "2026-10-05",
  to: "2026-10-11",
  jobs: [
    {
      jobId: "job-1",
      name: "Warehouse",
      type: "part_time",
      hourlyRate: "12.00",
      earnedMinutes: 480,
      plannedMinutes: 960,
      earnedAmount: "96.00",
      plannedAmount: "192.00",
    },
  ],
  totals: {
    earnedMinutes: 480,
    plannedMinutes: 960,
    earnedAmount: "96.00",
    plannedAmount: "192.00",
  },
};

function renderPage() {
  render(
    <MemoryRouter>
      <SummaryPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getSummary).mockResolvedValue(summary);
});

describe("SummaryPage", () => {
  it("starts on the current week and sends the local time", async () => {
    renderPage();

    expect(await screen.findByText("Warehouse")).toBeDefined();
    expect(screen.getByText("5 Oct to 11 Oct 2026")).toBeDefined();
    expect(getSummary).toHaveBeenCalledWith({
      range: "week",
      date: "2026-10-07",
      now: "2026-10-07T12:00",
    });
  });

  it("goes to the previous and next week", async () => {
    renderPage();
    await screen.findByText("Warehouse");

    fireEvent.click(screen.getByRole("button", { name: "Previous week" }));
    await waitFor(() =>
      expect(getSummary).toHaveBeenLastCalledWith(
        expect.objectContaining({ range: "week", date: "2026-09-30" }),
      ),
    );
    expect(screen.getByText("28 Sep to 4 Oct 2026")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Next week" }));
    await waitFor(() =>
      expect(getSummary).toHaveBeenLastCalledWith(
        expect.objectContaining({ range: "week", date: "2026-10-07" }),
      ),
    );
  });

  it("switches to the month and steps by month", async () => {
    renderPage();
    await screen.findByText("Warehouse");

    const month = screen.getByRole("button", { name: "Month" });
    fireEvent.click(month);

    await waitFor(() =>
      expect(getSummary).toHaveBeenLastCalledWith(
        expect.objectContaining({ range: "month", date: "2026-10-07" }),
      ),
    );
    expect(month.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("Oct 2026")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    await waitFor(() =>
      expect(getSummary).toHaveBeenLastCalledWith(
        expect.objectContaining({ range: "month", date: "2026-11-01" }),
      ),
    );
    expect(screen.getByText("Nov 2026")).toBeDefined();
  });

  it("says so when the period has no shifts", async () => {
    vi.mocked(getSummary).mockResolvedValue({
      ...summary,
      jobs: [],
    });
    renderPage();

    expect(await screen.findByText("No shifts in this period.")).toBeDefined();
  });

  it("shows an error when the summary cannot be loaded", async () => {
    vi.mocked(getSummary).mockRejectedValue(new Error("boom"));
    renderPage();

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Could not load your summary",
    );
  });

  it("shows the mini-job warning in month view when the API flags it", async () => {
    vi.mocked(getSummary).mockResolvedValue({
      ...summary,
      miniJob: { plannedAmount: "600.00", threshold: "540.00", warning: true },
    });
    renderPage();

    expect((await screen.findByRole("status")).textContent).toContain(
      "€600.00",
    );
  });

  it("shows no warning in week view, where the API sends no mini-job data", async () => {
    renderPage();
    await screen.findByText("Warehouse");

    expect(screen.getByRole("status").textContent).toBe("");
  });
});
