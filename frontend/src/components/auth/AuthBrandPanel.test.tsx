import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AUTH_PANEL } from "./auth-content";
import { AuthBrandPanel } from "./AuthBrandPanel";

function renderPanel() {
  return render(
    <MemoryRouter>
      <AuthBrandPanel />
    </MemoryRouter>,
  );
}

describe("AuthBrandPanel", () => {
  it("is a labelled side panel that a phone does not show", () => {
    renderPanel();

    const panel = screen.getByRole("complementary", { name: AUTH_PANEL.label });
    expect(panel.className).toContain("max-lg:hidden");
  });

  it("has the headline and every benefit", () => {
    renderPanel();

    expect(screen.getByText(AUTH_PANEL.headline)).toBeDefined();
    for (const benefit of AUTH_PANEL.benefits) {
      expect(screen.getByText(benefit)).toBeDefined();
    }
  });

  it("is not a heading, so the form's title stays the page's only h1", () => {
    renderPanel();

    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("shows the example week from the homepage, as a picture", () => {
    const { container } = renderPanel();

    expect(container.textContent).toContain("€174.00");
    expect(
      container.querySelector("[aria-hidden=true].shadow-xl"),
    ).not.toBeNull();
  });
});
