import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ModuleCard } from "./ModuleCard";

function renderCard(to?: string) {
  render(
    <MemoryRouter>
      <ModuleCard icon="calendar" title="Work Schedule" to={to} />
    </MemoryRouter>,
  );
}

describe("ModuleCard", () => {
  it("links into the module and has no badge when it has a destination", () => {
    renderCard("/shifts");

    const link = screen.getByRole("link", { name: "Work Schedule" });
    expect(link.getAttribute("href")).toBe("/shifts");
    expect(screen.queryByText("Coming later")).toBeNull();
  });

  it("is a plain card with a Coming later badge when it has no destination", () => {
    renderCard();

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Coming later")).toBeDefined();
  });

  it("has the module title as a level 3 heading in both cases", () => {
    renderCard("/shifts");
    expect(
      screen.getByRole("heading", { level: 3, name: "Work Schedule" }),
    ).toBeDefined();
  });

  it("draws a decorative icon in both cases", () => {
    const { container, unmount } = render(
      <MemoryRouter>
        <ModuleCard icon="wallet" title="Finance" />
      </MemoryRouter>,
    );
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
    unmount();

    const linked = render(
      <MemoryRouter>
        <ModuleCard icon="calendar" title="Work Schedule" to="/shifts" />
      </MemoryRouter>,
    );
    expect(
      linked.container.querySelector("svg")?.getAttribute("aria-hidden"),
    ).toBe("true");
  });

  it("dims the placeholder and highlights the real module", () => {
    const { container, unmount } = render(
      <MemoryRouter>
        <ModuleCard icon="leaf" title="Nutrition" />
      </MemoryRouter>,
    );
    expect(screen.getByText("Nutrition").className).toContain("text-ink-muted");
    expect(container.innerHTML).toContain("bg-neutral-soft");
    unmount();

    render(
      <MemoryRouter>
        <ModuleCard icon="calendar" title="Work Schedule" to="/shifts" />
      </MemoryRouter>,
    );
    expect(screen.getByText("Work Schedule").className).toContain("text-ink");
    expect(screen.getByText("Work Schedule").className).not.toContain(
      "text-ink-muted",
    );
  });

  it("uses the standard card padding", () => {
    renderCard("/shifts");

    expect(screen.getByRole("link").className).toContain("p-5");
  });
});
