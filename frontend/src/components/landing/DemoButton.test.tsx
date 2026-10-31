import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { demoDb } from "../../lib/demo/demo-db";
import { useAuthStore } from "../../store/auth-store";
import { DemoButton } from "./DemoButton";

vi.mock("../../lib/dates", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../lib/dates")>()),
  localNow: () => "2026-10-30T09:15",
}));

afterEach(() => {
  useAuthStore.setState({ user: null, accessToken: null });
});

function renderButton() {
  return render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<DemoButton />} />
        <Route path="/dashboard" element={<p>Dashboard page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("DemoButton", () => {
  it("is a quiet third button named Try the demo", () => {
    renderButton();

    const button = screen.getByRole("button", { name: "Try the demo" });
    expect(button.className).toContain("text-accent");
  });

  it("starts the demo around the visitor's today and opens the dashboard", () => {
    renderButton();

    fireEvent.click(screen.getByRole("button", { name: "Try the demo" }));

    expect(screen.getByText("Dashboard page")).toBeDefined();
    expect(useAuthStore.getState().user?.isDemo).toBe(true);
    expect(demoDb.shifts.map((shift) => shift.date)).toContain("2026-10-30");
  });
});
