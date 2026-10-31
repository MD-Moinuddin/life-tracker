import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SignupForm } from "./SignupForm";

function renderForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  render(<SignupForm onSubmit={onSubmit} />);
  return { onSubmit };
}

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: "Create account" }));
}

describe("SignupForm", () => {
  it("has name, email and password fields and a submit button", () => {
    renderForm();

    expect(screen.getByLabelText("Name").getAttribute("type")).toBe("text");
    expect(screen.getByLabelText("Email").getAttribute("type")).toBe("email");
    expect(screen.getByLabelText("Password").getAttribute("type")).toBe(
      "password",
    );
    expect(
      screen.getByRole("button", { name: "Create account" }),
    ).toBeDefined();
  });

  it("shows every error and does not submit an empty form", () => {
    const { onSubmit } = renderForm();

    submit();

    expect(screen.getByText("Name is required")).toBeDefined();
    expect(screen.getByText("Enter a valid email address")).toBeDefined();
    expect(
      screen.getByText("Choose a password that meets all the rules"),
    ).toBeDefined();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("moves focus to the first field with an error", () => {
    renderForm();
    fill("Name", "Md");

    submit();

    expect(document.activeElement).toBe(screen.getByLabelText("Email"));
  });

  it("shows the password rules up front and ticks them while typing", () => {
    renderForm();
    const rules = screen.getByRole("list", { name: "Password rules" });

    expect(rules.textContent).toContain("8 or more characters (not met yet)");

    fill("Password", "Abcdefg1");

    expect(rules.textContent).toContain("8 or more characters (met)");
    expect(rules.textContent).toContain("A lowercase letter (met)");
    expect(rules.textContent).toContain("An uppercase letter (met)");
    expect(rules.textContent).toContain("A number (met)");
  });

  it("only draws the missing rules as a problem once the password has been tried", () => {
    renderForm();
    fill("Password", "abcdefgh");
    const uppercase = () =>
      screen.getByText(/^An uppercase letter/).closest("li");
    expect(uppercase()?.className).not.toContain("text-danger");

    submit();

    expect(uppercase()?.className).toContain("text-danger");
    expect(
      screen.getByText(/^A lowercase letter/).closest("li")?.className,
    ).not.toContain("text-danger");
  });

  it("does not complain about an empty field that was only tabbed through", () => {
    renderForm();

    fireEvent.blur(screen.getByLabelText("Email"));

    expect(screen.queryByText("Enter a valid email address")).toBeNull();
  });

  it("shows a field's error when it is left, and clears it as soon as it is fixed", () => {
    renderForm();
    fill("Email", "md@");

    fireEvent.blur(screen.getByLabelText("Email"));
    expect(screen.getByText("Enter a valid email address")).toBeDefined();

    fill("Email", "md@example.com");
    expect(screen.queryByText("Enter a valid email address")).toBeNull();
  });

  it("rejects a password longer than 72 characters", () => {
    renderForm();
    fill("Name", "Md");
    fill("Email", "md@example.com");
    fill("Password", `Aa1${"x".repeat(70)}`);

    submit();

    expect(
      screen.getByText("Password must be at most 72 characters"),
    ).toBeDefined();
  });

  it("marks a field with errors as invalid", () => {
    renderForm();

    submit();

    expect(screen.getByLabelText("Name").getAttribute("aria-invalid")).toBe(
      "true",
    );
    expect(screen.getByLabelText("Password").getAttribute("aria-invalid")).toBe(
      "true",
    );
  });

  it("submits the values with the name trimmed", async () => {
    const { onSubmit } = renderForm();
    fill("Name", "  Md  ");
    fill("Email", "md@example.com");
    fill("Password", "Secret123");

    submit();

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        name: "Md",
        email: "md@example.com",
        password: "Secret123",
      }),
    );
  });

  it("disables the fields and shows progress while submitting", async () => {
    let finish: () => void = () => {};
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    renderForm(onSubmit);
    fill("Name", "Md");
    fill("Email", "md@example.com");
    fill("Password", "Secret123");

    submit();

    const busy = await screen.findByRole("button", {
      name: /Creating account/,
    });
    expect((busy as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText("Name") as HTMLInputElement).disabled).toBe(
      true,
    );

    finish();

    const ready = await screen.findByRole("button", { name: "Create account" });
    expect((ready as HTMLButtonElement).disabled).toBe(false);
  });

  it("can show and hide the password", () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(screen.getByLabelText("Password").getAttribute("type")).toBe("text");

    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(screen.getByLabelText("Password").getAttribute("type")).toBe(
      "password",
    );
  });

  it("asks the browser to offer a new password, not the saved one", () => {
    renderForm();

    expect(screen.getByLabelText("Password").getAttribute("autocomplete")).toBe(
      "new-password",
    );
  });

  it("sets autocomplete hints on the name and email fields", () => {
    renderForm();

    expect(screen.getByLabelText("Name").getAttribute("autocomplete")).toBe(
      "name",
    );
    expect(screen.getByLabelText("Email").getAttribute("autocomplete")).toBe(
      "email",
    );
  });

  it("announces the password problem as an alert, tied to the field", () => {
    renderForm();

    submit();

    const password = screen.getByLabelText("Password");
    const errorBlock = document.getElementById(
      password.getAttribute("aria-describedby") ?? "",
    );
    expect(errorBlock?.getAttribute("role")).toBe("alert");
    expect(errorBlock?.textContent).toBe(
      "Choose a password that meets all the rules",
    );
  });

  it("explains the name field", () => {
    renderForm();

    expect(screen.getByText("We'll use this to greet you.")).toBeDefined();
  });

  it("sets the phone keyboard hints on the email field", () => {
    renderForm();

    const email = screen.getByLabelText("Email");
    expect(email.getAttribute("inputmode")).toBe("email");
    expect(email.getAttribute("autocapitalize")).toBe("none");
    expect(email.getAttribute("spellcheck")).toBe("false");
  });
});
