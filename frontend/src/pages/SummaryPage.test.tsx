import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
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

    const table = await screen.findByRole("table");
    expect(within(table).getByText("Warehouse")).toBeDefined();
    expect(screen.getByText("5 Oct to 11 Oct 2026")).toBeDefined();
    expect(getSummary).toHaveBeenCalledWith({
      range: "week",
      date: "2026-10-07",
      now: "2026-10-07T12:00",
    });
  });

  it("lets the period navigator fill the row on a phone", async () => {
    renderPage();
    await screen.findByRole("table");

    const row = screen.getByRole("button", {
      name: "Previous week",
    }).parentElement;
    expect(row?.className).toContain("max-sm:w-full");
  });

  it("goes to the previous and next week", async () => {
    renderPage();
    await screen.findByRole("table");

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
    await screen.findByRole("table");

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

  it("has the page title in the shared header", async () => {
    renderPage();

    const heading = await screen.findByRole("heading", {
      level: 1,
      name: "Summary",
    });
    expect(heading.closest("header")).not.toBeNull();
  });

  it("shows an empty period as the shared empty card", async () => {
    vi.mocked(getSummary).mockResolvedValue({ ...summary, jobs: [] });
    renderPage();

    const message = await screen.findByText("No shifts in this period.");
    expect(message.parentElement?.className).toContain("border-dashed");
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
    await screen.findByRole("table");

    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("keeps the previous table on screen, marked busy, while the next period loads", async () => {
    let resolveNext: (value: Summary) => void = () => {};
    renderPage();
    await screen.findByRole("table");
    vi.mocked(getSummary).mockReturnValue(
      new Promise<Summary>((resolve) => {
        resolveNext = resolve;
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Next week" }));

    const table = await screen.findByRole("table");
    expect(table.closest("[aria-busy]")?.getAttribute("aria-busy")).toBe(
      "true",
    );
    expect(screen.queryByText(/Loading your summary/)).toBeNull();

    resolveNext({ ...summary, from: "2026-10-12", to: "2026-10-18" });
    await waitFor(() =>
      expect(
        screen
          .getByRole("table")
          .closest("[aria-busy]")
          ?.getAttribute("aria-busy"),
      ).toBe("false"),
    );
  });

  it("renders the same jobs in the table and in the phone cards", async () => {
    renderPage();

    const table = await screen.findByRole("table");
    const cards = screen.getByRole("list", {
      name: /hours and earnings per job/i,
    });
    expect(within(table).getByText("Warehouse")).toBeDefined();
    expect(within(cards).getByText("Warehouse")).toBeDefined();
  });

  it("shows the table from the sm breakpoint and the cards below it", async () => {
    renderPage();

    const table = await screen.findByRole("table");
    const cards = screen.getByRole("list", {
      name: /hours and earnings per job/i,
    });
    const tableWrapper = table.closest("div.hidden");
    expect(tableWrapper?.className).toContain("sm:block");
    expect(cards.closest("div.sm\\:hidden")).not.toBeNull();
    expect(cards.closest("div.sm\\:hidden")?.classList.contains("hidden")).toBe(
      false,
    );
  });

  it("shows the mini-job limit bar for a month with a mini-job, not for a week", async () => {
    const miniJob = {
      plannedAmount: "520.00",
      threshold: "538.00",
      warning: false,
    };
    vi.mocked(getSummary).mockImplementation(async ({ range }) =>
      range === "month"
        ? {
            ...summary,
            jobs: summary.jobs.map((job) => ({
              ...job,
              type: "mini_job" as const,
            })),
            miniJob,
          }
        : summary,
    );
    renderPage();
    await screen.findByRole("table");
    expect(
      screen.queryByRole("progressbar", { name: /mini-job earnings/i }),
    ).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Month" }));

    expect(
      await screen.findByRole("progressbar", { name: /mini-job earnings/i }),
    ).toBeDefined();
  });

  it("keeps the period controls stuck to the top on a phone, opaque and full-bleed", async () => {
    renderPage();
    await screen.findByRole("table");

    const root = screen.getByRole("group", {
      name: "Summary period",
    }).parentElement;
    for (const cls of [
      "max-sm:sticky",
      "max-sm:top-0",
      "max-sm:z-10",
      "max-sm:bg-page",
      "max-sm:-mx-4",
      "max-sm:px-4",
      "max-sm:mb-1",
    ]) {
      expect(root?.className).toContain(cls);
    }
  });
});
