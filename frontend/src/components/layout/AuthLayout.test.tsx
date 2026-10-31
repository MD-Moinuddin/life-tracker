import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AuthLayout } from "./AuthLayout";

function renderLayout() {
  render(
    <MemoryRouter>
      <AuthLayout title="Welcome back" footer={<span>Footer text</span>}>
        <p>Form goes here</p>
      </AuthLayout>
    </MemoryRouter>,
  );
}

describe("AuthLayout", () => {
  it("shows the brand, and a panel about the app, which a phone does not show", () => {
    renderLayout();

    expect(screen.getAllByText("Life Tracker").length).toBeGreaterThan(0);
    const panel = screen.getByRole("complementary", {
      name: "About Life Tracker",
    });
    expect(panel.className).toContain("max-lg:hidden");
    expect(panel.textContent).toContain(
      "Know what you have earned, and what is still to come",
    );
  });

  it("links every brand mark back to the home page", () => {
    renderLayout();

    for (const link of screen.getAllByRole("link", { name: "Life Tracker" })) {
      expect(link.getAttribute("href")).toBe("/");
    }
  });

  it("offers a way back to the home page", () => {
    renderLayout();

    expect(
      screen.getByRole("link", { name: "Back to home" }).getAttribute("href"),
    ).toBe("/");
  });

  it("shows the line under the title when there is one", () => {
    render(
      <MemoryRouter>
        <AuthLayout
          title="Welcome back"
          lead="Log in to see your week."
          footer="x"
        >
          y
        </AuthLayout>
      </MemoryRouter>,
    );

    expect(screen.getByText("Log in to see your week.")).toBeDefined();
  });

  it("offers the demo under the card only when asked to", () => {
    const { unmount } = render(
      <MemoryRouter>
        <AuthLayout title="a" footer="b">
          c
        </AuthLayout>
      </MemoryRouter>,
    );
    expect(screen.queryByRole("button", { name: "Try the demo" })).toBeNull();
    unmount();

    render(
      <MemoryRouter>
        <AuthLayout title="a" footer="b" showDemo>
          c
        </AuthLayout>
      </MemoryRouter>,
    );
    expect(screen.getByRole("button", { name: "Try the demo" })).toBeDefined();
  });

  it("has the title as the page heading", () => {
    renderLayout();

    expect(
      screen.getByRole("heading", { level: 1, name: "Welcome back" }),
    ).toBeDefined();
  });

  it("puts the form and the footer on the page", () => {
    renderLayout();

    expect(screen.getByText("Form goes here")).toBeDefined();
    expect(screen.getByText("Footer text")).toBeDefined();
  });

  it("is one main landmark", () => {
    renderLayout();

    expect(screen.getAllByRole("main")).toHaveLength(1);
  });

  it("uses no raw palette colours", () => {
    const { container } = render(
      <MemoryRouter>
        <AuthLayout title="x" footer="y">
          z
        </AuthLayout>
      </MemoryRouter>,
    );

    expect(container.innerHTML).not.toMatch(/slate-|indigo-|red-/);
  });
});
