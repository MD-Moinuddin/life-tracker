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
  it.each([
    ["/dashboard", "Dashboard"],
    ["/jobs", "Jobs"],
    ["/shifts", "Shifts"],
  ])("marks the link of the current page (%s)", (path, label) => {
    renderAt(path);

    const link = screen.getByRole("link", { name: label });
    expect(link.getAttribute("aria-current")).toBe("page");
  });

  it("marks no link on other pages", () => {
    renderAt("/somewhere-else");

    for (const label of ["Dashboard", "Jobs", "Shifts"]) {
      const link = screen.getByRole("link", { name: label });
      expect(link.getAttribute("aria-current")).toBeNull();
    }
  });
});
