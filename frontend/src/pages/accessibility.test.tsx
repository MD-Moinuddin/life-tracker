import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { DashboardPage } from "./DashboardPage";
import { LoginPage } from "./LoginPage";
import { SignupPage } from "./SignupPage";

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

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
