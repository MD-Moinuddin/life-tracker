import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PasswordInput } from "./PasswordInput";

describe("PasswordInput", () => {
  it("hides the password by default", () => {
    render(<PasswordInput aria-label="Password" />);

    expect(screen.getByLabelText("Password").getAttribute("type")).toBe(
      "password",
    );
    expect(screen.getByRole("button", { name: "Show password" })).toBeDefined();
  });

  it("shows the password when the toggle is pressed, and hides it again", () => {
    render(<PasswordInput aria-label="Password" />);

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(screen.getByLabelText("Password").getAttribute("type")).toBe("text");

    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(screen.getByLabelText("Password").getAttribute("type")).toBe(
      "password",
    );
  });

  it("shows Show or Hide as the visible text", () => {
    render(<PasswordInput aria-label="Password" />);

    const toggle = screen.getByRole("button", { name: "Show password" });
    expect(toggle.textContent).toBe("Show");

    fireEvent.click(toggle);
    expect(toggle.textContent).toBe("Hide");
  });

  it("disables the toggle when the input is disabled", () => {
    render(<PasswordInput aria-label="Password" disabled />);

    expect(
      (
        screen.getByRole("button", {
          name: "Show password",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it("does not submit a form when the toggle is pressed", () => {
    render(
      <form>
        <PasswordInput aria-label="Password" />
      </form>,
    );

    expect(
      screen
        .getByRole("button", { name: "Show password" })
        .getAttribute("type"),
    ).toBe("button");
  });

  it("keeps the value and passes native props to the input", () => {
    render(
      <PasswordInput
        aria-label="Password"
        defaultValue="secret"
        autoComplete="current-password"
      />,
    );

    const input = screen.getByLabelText("Password") as HTMLInputElement;
    expect(input.value).toBe("secret");
    expect(input.getAttribute("autocomplete")).toBe("current-password");

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect((screen.getByLabelText("Password") as HTMLInputElement).value).toBe(
      "secret",
    );
  });
});
