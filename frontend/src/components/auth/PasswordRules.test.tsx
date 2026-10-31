import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PASSWORD_RULES } from "../../lib/auth-validation";
import { PasswordRules } from "./PasswordRules";

describe("PasswordRules", () => {
  it("lists every rule, none met for an empty password", () => {
    render(<PasswordRules password="" />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(PASSWORD_RULES.length);
    for (const item of items) {
      expect(item.textContent).toContain("(not met yet)");
    }
  });

  it("marks only the rules the password meets", () => {
    render(<PasswordRules password="abcdefgh" />);

    expect(screen.getByText(/^8 or more characters/).textContent).toContain(
      "(met)",
    );
    expect(screen.getByText(/^A lowercase letter/).textContent).toContain(
      "(met)",
    );
    expect(screen.getByText(/^An uppercase letter/).textContent).toContain(
      "(not met yet)",
    );
    expect(screen.getByText(/^A number/).textContent).toContain(
      "(not met yet)",
    );
  });

  it("keeps unmet rules neutral until failures are to be shown", () => {
    const { rerender } = render(<PasswordRules password="abc" />);
    expect(
      screen.getByText(/^A number/).closest("li")?.className,
    ).not.toContain("text-danger");

    rerender(<PasswordRules password="abc" showFailures />);

    expect(screen.getByText(/^A number/).closest("li")?.className).toContain(
      "text-danger",
    );
    expect(
      screen.getByText(/^A lowercase letter/).closest("li")?.className,
    ).not.toContain("text-danger");
  });

  it("draws the tick and the circle for assistive tech as decoration only", () => {
    const { container } = render(<PasswordRules password="Abcdefg1" />);

    for (const mark of container.querySelectorAll("li > span[aria-hidden]")) {
      expect(mark.getAttribute("aria-hidden")).toBe("true");
    }
  });
});
