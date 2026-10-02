import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormField } from "./FormField";

function renderField(props: { hint?: string; errors?: string[] } = {}) {
  render(
    <FormField label="Name" {...props}>
      {(control) => <input {...control} />}
    </FormField>,
  );
  return screen.getByLabelText("Name");
}

describe("FormField", () => {
  it("connects the label to the control", () => {
    const input = renderField();

    expect(input.getAttribute("aria-invalid")).toBe("false");
    expect(input.getAttribute("aria-describedby")).toBeNull();
  });

  it("links a hint to the control", () => {
    const input = renderField({ hint: "Use the name on your contract" });

    const hint = screen.getByText("Use the name on your contract");
    expect(input.getAttribute("aria-describedby")).toBe(hint.id);
  });

  it("links errors to the control and marks it invalid", () => {
    const input = renderField({ errors: ["Name is required"] });

    const message = screen.getByText("Name is required");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe(
      message.parentElement?.id,
    );
  });

  it("links both the hint and the errors when both are shown", () => {
    const input = renderField({
      hint: "Use the name on your contract",
      errors: ["Name is required"],
    });

    const hint = screen.getByText("Use the name on your contract");
    const message = screen.getByText("Name is required");
    expect(input.getAttribute("aria-describedby")).toBe(
      `${hint.id} ${message.parentElement?.id}`,
    );
  });
});
