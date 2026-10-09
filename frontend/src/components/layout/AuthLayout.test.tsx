import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthLayout } from "./AuthLayout";

function renderLayout() {
  render(
    <AuthLayout title="Welcome back" footer={<span>Footer text</span>}>
      <p>Form goes here</p>
    </AuthLayout>,
  );
}

describe("AuthLayout", () => {
  it("shows the brand and a tagline", () => {
    renderLayout();

    expect(screen.getByText("Life Tracker")).toBeDefined();
    expect(
      screen.getByText("Track work, shifts and earnings in one place"),
    ).toBeDefined();
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
      <AuthLayout title="x" footer="y">
        z
      </AuthLayout>,
    );

    expect(container.innerHTML).not.toMatch(/slate-|indigo-|red-/);
  });
});
