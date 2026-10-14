import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormStatus } from "./FormStatus";

describe("FormStatus", () => {
  it("keeps an empty live region on the page when there is no message", () => {
    render(<FormStatus message={null} />);

    const region = screen.getByRole("alert");
    expect(region.textContent).toBe("");
    expect(region.className).toContain("sr-only");
    expect(region.getAttribute("aria-live")).toBe("assertive");
  });

  it("shows the message in a danger alert inside the live region", () => {
    render(<FormStatus message="Invalid email or password" />);

    const region = screen.getByRole("alert");
    expect(region.textContent).toContain("Invalid email or password");
    expect(region.className).not.toContain("sr-only");
    expect(region.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("announces only once: the inner alert has no role of its own", () => {
    render(<FormStatus message="Something went wrong" />);

    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });
});
