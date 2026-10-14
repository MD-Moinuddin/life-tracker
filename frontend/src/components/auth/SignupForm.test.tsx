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
  fireEvent.click(screen.getByRole("button", { name: "Sign up" }));
}

describe("SignupForm", () => {
  it("has name, email and password fields and a submit button", () => {
    renderForm();

    expect(screen.getByLabelText("Name").getAttribute("type")).toBe("text");
    expect(screen.getByLabelText("Email").getAttribute("type")).toBe("email");
    expect(screen.getByLabelText("Password").getAttribute("type")).toBe(
      "password",
    );
    expect(screen.getByRole("button", { name: "Sign up" })).toBeDefined();
  });

  it("shows every error and does not submit an empty form", () => {
    const { onSubmit } = renderForm();

    submit();

    expect(screen.getByText("Name is required")).toBeDefined();
    expect(screen.getByText("Enter a valid email address")).toBeDefined();
    expect(
      screen.getByText("Password must be at least 8 characters"),
    ).toBeDefined();
    expect(
      screen.getByText("Password must contain a lowercase letter"),
    ).toBeDefined();
    expect(
      screen.getByText("Password must contain an uppercase letter"),
    ).toBeDefined();
    expect(screen.getByText("Password must contain a number")).toBeDefined();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("lists only the password rules that are broken", () => {
    renderForm();
    fill("Name", "Md");
    fill("Email", "md@example.com");
    fill("Password", "abcdefgh");

    submit();

    expect(
      screen.getByText("Password must contain an uppercase letter"),
    ).toBeDefined();
    expect(screen.getByText("Password must contain a number")).toBeDefined();
    expect(
      screen.queryByText("Password must be at least 8 characters"),
    ).toBeNull();
    expect(
      screen.queryByText("Password must contain a lowercase letter"),
    ).toBeNull();
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

    const busy = await screen.findByRole("button", { name: /Signing up/ });
    expect((busy as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText("Name") as HTMLInputElement).disabled).toBe(
      true,
    );

    finish();

    const ready = await screen.findByRole("button", { name: "Sign up" });
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

  it("announces all the password problems together", () => {
    renderForm();

    submit();

    const password = screen.getByLabelText("Password");
    const errorBlock = document.getElementById(
      password.getAttribute("aria-describedby") ?? "",
    );
    expect(errorBlock?.getAttribute("role")).toBe("alert");
    expect(errorBlock?.querySelectorAll("p")).toHaveLength(4);
  });
});
