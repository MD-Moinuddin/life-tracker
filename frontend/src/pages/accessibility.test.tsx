import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { DashboardPage } from "./DashboardPage";
import { LoginPage } from "./LoginPage";
import { SignupPage } from "./SignupPage";

vi.mock("../lib/summary-api", () => ({
  getSummary: vi.fn().mockResolvedValue({
    from: "2026-10-05",
    to: "2026-10-11",
    jobs: [],
    totals: {
      earnedMinutes: 0,
      plannedMinutes: 0,
      earnedAmount: "0.00",
      plannedAmount: "0.00",
    },
  }),
}));

describe("accessibility", () => {
  it("LoginPage has no violations", async () => {
    const { container } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("SignupPage has no violations", async () => {
    const { container } = render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>,
    );

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("DashboardPage has no violations", async () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await screen.findByText("No shifts this week yet.");
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
