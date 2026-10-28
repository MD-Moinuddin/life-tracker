import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { BrandLink } from "./BrandLink";

function renderLink(props: Parameters<typeof BrandLink>[0] = {}) {
  render(
    <MemoryRouter>
      <BrandLink {...props} />
    </MemoryRouter>,
  );
  return screen.getByRole("link", { name: "Life Tracker" });
}

describe("BrandLink", () => {
  it("links the logo to the home page by default", () => {
    expect(renderLink().getAttribute("href")).toBe("/");
  });

  it("links to the given route", () => {
    expect(renderLink({ to: "/dashboard" }).getAttribute("href")).toBe(
      "/dashboard",
    );
  });
});
