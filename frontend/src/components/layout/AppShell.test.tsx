import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AppShell } from "./AppShell";

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppShell>
        <p>content</p>
      </AppShell>
    </MemoryRouter>,
  );
}

describe("AppShell navigation", () => {
  it("marks the link of the current page", () => {
    renderAt("/dashboard");

    const link = screen.getByRole("link", { name: "Dashboard" });
    expect(link.getAttribute("aria-current")).toBe("page");
  });

  it("does not mark the link on other pages", () => {
    renderAt("/somewhere-else");

    const link = screen.getByRole("link", { name: "Dashboard" });
    expect(link.getAttribute("aria-current")).toBeNull();
  });
});
