import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoginForm } from "./LoginForm";

function renderForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  render(<LoginForm onSubmit={onSubmit} />);
  return { onSubmit };
}

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: "Log in" }));
}

describe("LoginForm", () => {
  it("has an email field, a password field and a submit button", () => {
    renderForm();

    expect(screen.getByLabelText("Email").getAttribute("type")).toBe("email");
    expect(screen.getByLabelText("Password").getAttribute("type")).toBe(
      "password",
    );
    expect(screen.getByRole("button", { name: "Log in" })).toBeDefined();
  });

  it("sets autocomplete hints on the fields", () => {
    renderForm();

    expect(screen.getByLabelText("Email").getAttribute("autocomplete")).toBe(
      "email",
    );
    expect(screen.getByLabelText("Password").getAttribute("autocomplete")).toBe(
      "current-password",
    );
  });

  it("shows both errors and does not submit an empty form", () => {
    const { onSubmit } = renderForm();

    submit();

    expect(screen.getByText("Enter a valid email address")).toBeDefined();
    expect(screen.getByText("Password is required")).toBeDefined();
    expect(screen.getByLabelText("Email").getAttribute("aria-invalid")).toBe(
      "true",
    );
    expect(screen.getByLabelText("Password").getAttribute("aria-invalid")).toBe(
      "true",
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects an email without a domain but accepts the password", () => {
    const { onSubmit } = renderForm();
    fill("Email", "md@example");
    fill("Password", "secret");

    submit();

    expect(screen.getByText("Enter a valid email address")).toBeDefined();
    expect(screen.queryByText("Password is required")).toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("links each error to its field", () => {
    renderForm();

    submit();

    const email = screen.getByLabelText("Email");
    const message = screen.getByText("Enter a valid email address");
    expect(email.getAttribute("aria-describedby")).toBe(
      message.id || message.parentElement?.id,
    );
  });

  it("submits the entered values", async () => {
    const { onSubmit } = renderForm();
    fill("Email", "md@example.com");
    fill("Password", "secret");

    submit();

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        email: "md@example.com",
        password: "secret",
      }),
    );
  });

  it("disables the fields and shows progress while submitting, then recovers", async () => {
    let finish: () => void = () => {};
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    renderForm(onSubmit);
    fill("Email", "md@example.com");
    fill("Password", "secret");

    submit();

    const busy = await screen.findByRole("button", { name: /Logging in/ });
    expect((busy as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText("Email") as HTMLInputElement).disabled).toBe(
      true,
    );
    expect(
      (screen.getByLabelText("Password") as HTMLInputElement).disabled,
    ).toBe(true);

    finish();

    const ready = await screen.findByRole("button", { name: "Log in" });
    expect((ready as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByLabelText("Email") as HTMLInputElement).disabled).toBe(
      false,
    );
  });

  it("can show and hide the password", () => {
    renderForm();
    fill("Password", "secret");

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(screen.getByLabelText("Password").getAttribute("type")).toBe("text");

    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(screen.getByLabelText("Password").getAttribute("type")).toBe(
      "password",
    );
  });

  it("does not submit the form when the toggle is pressed", () => {
    const { onSubmit } = renderForm();
    fill("Email", "md@example.com");
    fill("Password", "secret");

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
