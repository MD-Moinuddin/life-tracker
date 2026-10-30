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

    const jobs = await screen.findByRole("list", { name: /earnings by job/i });
    expect(within(jobs).getByText("Warehouse")).toBeDefined();
    expect(screen.getByText("5 Oct to 11 Oct 2026")).toBeDefined();
    expect(getSummary).toHaveBeenCalledWith({
      range: "week",
      date: "2026-10-07",
      now: "2026-10-07T12:00",
    });
  });

  it("lets the period navigator fill the row on a phone", async () => {
    renderPage();
    await screen.findByRole("region", { name: "Totals" });

    const row = screen.getByRole("button", {
      name: "Previous week",
    }).parentElement;
    expect(row?.className).toContain("max-sm:w-full");
  });

  it("goes to the previous and next week", async () => {
    renderPage();
    await screen.findByRole("region", { name: "Totals" });

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
    await screen.findByRole("region", { name: "Totals" });

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

  it("says so when the week has no shifts, and links to the shifts page", async () => {
    vi.mocked(getSummary).mockResolvedValue({
      ...summary,
      jobs: [],
    });
    renderPage();

    expect(await screen.findByText("No shifts this week")).toBeDefined();
    expect(
      screen.getByRole("link", { name: "Go to shifts" }).getAttribute("href"),
    ).toBe("/shifts");
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

    const message = await screen.findByText("No shifts this week");
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
    await screen.findByRole("region", { name: "Totals" });

    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("keeps the previous summary on screen, marked busy, while the next period loads", async () => {
    let resolveNext: (value: Summary) => void = () => {};
    renderPage();
    await screen.findByRole("region", { name: "Totals" });
    vi.mocked(getSummary).mockReturnValue(
      new Promise<Summary>((resolve) => {
        resolveNext = resolve;
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Next week" }));

    const table = await screen.findByRole("region", { name: "Totals" });
    expect(table.closest("[aria-busy]")?.getAttribute("aria-busy")).toBe(
      "true",
    );
    expect(screen.queryByText(/Loading your summary/)).toBeNull();

    resolveNext({ ...summary, from: "2026-10-12", to: "2026-10-18" });
    await waitFor(() =>
      expect(
        screen
          .getByRole("region", { name: "Totals" })
          .closest("[aria-busy]")
          ?.getAttribute("aria-busy"),
      ).toBe("false"),
    );
  });

  it("shows the totals as three headline figures", async () => {
    renderPage();

    const totals = await screen.findByRole("region", { name: "Totals" });
    expect(within(totals).getByText("€96.00")).toBeDefined();
    expect(within(totals).getByText("8h finished")).toBeDefined();
    expect(within(totals).getByText("€192.00")).toBeDefined();
    expect(within(totals).getByText("16h scheduled")).toBeDefined();
    expect(within(totals).getByText("50%")).toBeDefined();
  });

  it("shows a card per job by default and the table on request", async () => {
    renderPage();

    await screen.findByRole("list", { name: /earnings by job/i });
    expect(screen.queryByRole("table")).toBeNull();
    const cards = screen.getByRole("button", { name: "Cards" });
    expect(cards.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Table" }));

    const table = await screen.findByRole("table");
    expect(within(table).getByText("Warehouse")).toBeDefined();
    expect(screen.queryByRole("list", { name: /earnings by job/i })).toBeNull();
  });

  it("renders the same jobs in the desktop cards and in the phone cards", async () => {
    renderPage();

    const desktop = await screen.findByRole("list", {
      name: /earnings by job/i,
    });
    const phone = screen.getByRole("list", {
      name: /hours and earnings per job/i,
    });
    expect(within(desktop).getByText("Warehouse")).toBeDefined();
    expect(within(phone).getByText("Warehouse")).toBeDefined();
  });

  it("shows the desktop design from the sm breakpoint and the phone cards below it", async () => {
    renderPage();

    const totals = await screen.findByRole("region", { name: "Totals" });
    const phone = screen.getByRole("list", {
      name: /hours and earnings per job/i,
    });
    expect(totals.closest("div.max-sm\\:hidden")).not.toBeNull();
    expect(phone.closest("div.sm\\:hidden")).not.toBeNull();
    expect(phone.closest("div.sm\\:hidden")?.classList.contains("hidden")).toBe(
      false,
    );
  });

  it("explains earned and planned in an info popover next to the title", async () => {
    renderPage();
    await screen.findByRole("region", { name: "Totals" });

    fireEvent.click(
      screen.getByRole("button", { name: "How these numbers work" }),
    );

    expect(screen.getByRole("note").textContent).toContain(
      "Earned counts finished shifts",
    );
  });

  it("offers a jump back to this week only when on another week", async () => {
    renderPage();
    await screen.findByRole("region", { name: "Totals" });
    expect(screen.queryByRole("button", { name: "This week" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Previous week" }));
    const jump = await screen.findByRole("button", { name: "This week" });

    fireEvent.click(jump);
    await waitFor(() =>
      expect(getSummary).toHaveBeenLastCalledWith(
        expect.objectContaining({ range: "week", date: "2026-10-07" }),
      ),
    );
    expect(screen.queryByRole("button", { name: "This week" })).toBeNull();
  });

  it("names the jump after the range", async () => {
    renderPage();
    await screen.findByRole("region", { name: "Totals" });

    fireEvent.click(screen.getByRole("button", { name: "Month" }));
    fireEvent.click(await screen.findByRole("button", { name: "Next month" }));

    expect(
      await screen.findByRole("button", { name: "This month" }),
    ).toBeDefined();
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
    await screen.findByRole("region", { name: "Totals" });
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
    await screen.findByRole("region", { name: "Totals" });

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
