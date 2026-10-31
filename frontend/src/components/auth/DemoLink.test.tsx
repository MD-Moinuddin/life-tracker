import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "../../store/auth-store";
import { DemoLink } from "./DemoLink";

vi.mock("../../lib/dates", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../lib/dates")>()),
  localNow: () => "2026-10-30T09:15",
}));

afterEach(() => {
  useAuthStore.setState({ user: null, accessToken: null });
});

function renderLink() {
  render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<DemoLink />} />
        <Route path="/dashboard" element={<p>Dashboard page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("DemoLink", () => {
  it("says it is sample data, with the demo as the action", () => {
    renderLink();

    expect(screen.getByText(/Just looking\?/).textContent).toContain(
      "with sample data.",
    );
    expect(screen.getByRole("button", { name: "Try the demo" })).toBeDefined();
  });

  it("opens the demo on the Dashboard", () => {
    renderLink();

    fireEvent.click(screen.getByRole("button", { name: "Try the demo" }));

    expect(screen.getByText("Dashboard page")).toBeDefined();
    expect(useAuthStore.getState().user?.isDemo).toBe(true);
  });
});
