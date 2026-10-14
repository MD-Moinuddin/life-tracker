import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSummary } from "../lib/summary-api";
import type { Summary } from "../lib/summary-api";
import { useAuthStore } from "../store/auth-store";
import { DashboardPage } from "./DashboardPage";

vi.mock("../lib/summary-api", () => ({ getSummary: vi.fn() }));
vi.mock("../lib/dates", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/dates")>()),
  localNow: () => "2026-10-07T19:30",
}));

const user = {
  id: "user-1",
  name: "Md Moinuddin",
  email: "md@example.com",
  createdAt: "2026-10-01T09:00:00.000Z",
};

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
      plannedMinutes: 1230,
      earnedAmount: "96.00",
      plannedAmount: "252.75",
    },
  ],
  totals: {
    earnedMinutes: 480,
    plannedMinutes: 1230,
    earnedAmount: "96.00",
    plannedAmount: "252.75",
  },
};

function renderPage() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getSummary).mockResolvedValue(summary);
  useAuthStore.setState({ user, accessToken: "token" });
});

afterEach(() => {
  useAuthStore.getState().clearAuth();
});

describe("DashboardPage", () => {
  it("greets the user by first name for the time of day", async () => {
    renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "Good evening, Md" }),
    ).toBeDefined();
    await screen.findByText("€252.75");
  });

  it("asks for this week's summary with the browser's local time", async () => {
    renderPage();

    await screen.findByText("€252.75");
    expect(getSummary).toHaveBeenCalledWith({
      range: "week",
      date: "2026-10-07",
      now: "2026-10-07T19:30",
    });
  });

  it("shows the week at a glance once it loads", async () => {
    renderPage();

    expect(await screen.findByText("€252.75")).toBeDefined();
    expect(screen.getByText("planned this week · 20h 30m")).toBeDefined();
  });

  it("still shows the greeting and every module when the week cannot be loaded", async () => {
    vi.mocked(getSummary).mockRejectedValue(new Error("network down"));
    renderPage();

    expect(await screen.findByRole("alert")).toBeDefined();
    expect(
      screen.getByRole("heading", { level: 1, name: "Good evening, Md" }),
    ).toBeDefined();
    for (const title of ["Work Schedule", "Fitness", "Nutrition", "Finance"]) {
      expect(
        screen.getByRole("heading", { level: 3, name: title }),
      ).toBeDefined();
    }
  });

  it("makes Work Schedule the only module link", async () => {
    renderPage();

    const main = within(screen.getByRole("main"));
    expect(
      main.getByRole("link", { name: "Work Schedule" }).getAttribute("href"),
    ).toBe("/shifts");
    for (const title of ["Fitness", "Nutrition", "Finance"]) {
      expect(main.queryByRole("link", { name: title })).toBeNull();
    }
    expect(main.getAllByText("Coming later")).toHaveLength(3);
    await screen.findByText("€252.75");
  });

  it("has a Modules section heading under the week card", async () => {
    renderPage();

    expect(
      screen.getByRole("heading", { level: 2, name: "Modules" }),
    ).toBeDefined();
    await screen.findByText("€252.75");
  });

  it("has no accessibility violations once the week has loaded", async () => {
    const { container } = renderPage();
    await screen.findByText("€252.75");

    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("has no accessibility violations in the error state", async () => {
    vi.mocked(getSummary).mockRejectedValue(new Error("network down"));
    const { container } = renderPage();
    await screen.findByRole("alert");

    expect((await axe(container)).violations).toHaveLength(0);
  });
});
