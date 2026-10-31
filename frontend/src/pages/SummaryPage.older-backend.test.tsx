import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authedFetch } from "../lib/authed-api";
import { SummaryPage } from "./SummaryPage";

vi.mock("../lib/authed-api", () => ({ authedFetch: vi.fn() }));
vi.mock("../lib/dates", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/dates")>()),
  localNow: () => "2026-10-07T12:00",
}));

beforeEach(() => {
  vi.resetAllMocks();
});

// The real API client, against a backend from before paid leave: the response
// has no `leave` anywhere.
describe("SummaryPage with an older backend", () => {
  it("renders the figures without crashing when the summary has no leave", async () => {
    vi.mocked(authedFetch).mockResolvedValue({
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
    });

    render(
      <MemoryRouter>
        <SummaryPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("list", { name: /earnings by job/i }),
    ).toBeDefined();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByText(/Paid leave/)).toBeNull();
  });
});
