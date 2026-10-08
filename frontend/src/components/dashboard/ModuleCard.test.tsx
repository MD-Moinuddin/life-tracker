import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ModuleCard } from "./ModuleCard";

function renderCard(to?: string) {
  render(
    <MemoryRouter>
      <ModuleCard icon="🗓️" title="Work Schedule" to={to} />
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
});
