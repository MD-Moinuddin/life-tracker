import { fireEvent, render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { startDemoSession } from "../lib/demo/demo-session";
import { useAuthStore } from "../store/auth-store";

// No API mocks here: the real pages talk to the in-memory demo, as in the
// browser, so this checks that the demo answers everything the pages ask.
vi.mock("../lib/dates", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/dates")>()),
  localNow: () => "2026-10-30T09:15",
}));

function renderDemoAt(path: string) {
  startDemoSession("2026-10-30");
  useAuthStore.setState({ isInitialized: true });
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  useAuthStore.setState({
    user: null,
    accessToken: null,
    isInitialized: false,
  });
});

describe("the demo, through the real pages", () => {
  it("fills the Dashboard with the week and today's shifts", async () => {
    renderDemoAt("/dashboard");

    expect(
      await screen.findByRole("heading", { level: 2, name: "Today" }),
    ).toBeDefined();
    expect(await screen.findByText(/earned · .* finished/)).toBeDefined();
    expect(screen.getByRole("region", { name: "Demo mode" })).toBeDefined();
  });

  it("lists two jobs and lets the visitor add one", async () => {
    renderDemoAt("/jobs");

    const list = await within(await screen.findByRole("main")).findByRole(
      "list",
    );
    expect(within(list).getByText("Cafe")).toBeDefined();
    expect(within(list).getByText("Restaurant")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Add job" }));
    const dialog = await screen.findByRole("dialog", { name: "Add a job" });
    fireEvent.change(within(dialog).getByLabelText("Name"), {
      target: { value: "Kiosk" },
    });
    fireEvent.change(within(dialog).getByLabelText("Hourly rate (€)"), {
      target: { value: "11,5" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add job" }));

    expect(await within(list).findByText("Kiosk")).toBeDefined();
  });

  it("lists the upcoming shifts in weekly groups", async () => {
    renderDemoAt("/shifts");

    expect(await screen.findByText("This week")).toBeDefined();
    expect(
      screen.getAllByRole("button", { name: /^Actions for / }).length,
    ).toBeGreaterThan(3);
  });

  it("shows the week summary and the month with the mini-job limit", async () => {
    renderDemoAt("/summary");

    expect(await screen.findByRole("region", { name: "Totals" })).toBeDefined();
    expect(
      screen.queryByRole("progressbar", { name: /mini-job earnings/i }),
    ).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Month" }));

    expect(
      await screen.findByRole("progressbar", { name: /mini-job earnings/i }),
    ).toBeDefined();
  });

  it("never touches the network", async () => {
    renderDemoAt("/dashboard");
    await screen.findByRole("heading", { level: 2, name: "Today" });

    expect(fetch).not.toHaveBeenCalled();
  });

  it("has no accessibility violations on the Dashboard", async () => {
    const { container } = renderDemoAt("/dashboard");
    await screen.findByRole("heading", { level: 2, name: "Today" });

    expect((await axe(container)).violations).toHaveLength(0);
  });
});
