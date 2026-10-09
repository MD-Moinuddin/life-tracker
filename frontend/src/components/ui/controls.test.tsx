import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "./Input";
import { Select } from "./Select";
import { Textarea } from "./Textarea";

describe("Input", () => {
  it("is a text control with the shared look", () => {
    render(<Input aria-label="Name" />);

    const input = screen.getByLabelText("Name");
    expect(input.tagName).toBe("INPUT");
    expect(input.className).toContain("rounded-control");
    expect(input.className).toContain("border-border-strong");
    expect(input.className).toContain("min-h-11");
  });

  it("styles the invalid state from aria-invalid", () => {
    render(<Input aria-label="Name" aria-invalid />);

    expect(screen.getByLabelText("Name").className).toContain(
      "aria-invalid:border-danger",
    );
  });

  it("passes native props and merges extra classes", () => {
    render(
      <Input
        aria-label="Rate"
        type="number"
        placeholder="12.50"
        className="w-24"
      />,
    );

    const input = screen.getByLabelText("Rate");
    expect(input.getAttribute("type")).toBe("number");
    expect(input.getAttribute("placeholder")).toBe("12.50");
    expect(input.className).toContain("w-24");
  });
});

describe("Select", () => {
  it("is a select with the same shared look", () => {
    render(
      <Select aria-label="Job">
        <option value="a">Warehouse</option>
      </Select>,
    );

    const select = screen.getByLabelText("Job");
    expect(select.tagName).toBe("SELECT");
    expect(select.className).toContain("rounded-control");
    expect(screen.getByRole("option", { name: "Warehouse" })).toBeDefined();
  });
});

describe("Textarea", () => {
  it("is a textarea with the shared look", () => {
    render(<Textarea aria-label="Notes" />);

    const textarea = screen.getByLabelText("Notes");
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea.className).toContain("rounded-control");
    expect(textarea.className).toContain("border-border-strong");
    expect(textarea.className).toContain("resize-y");
  });

  it("merges extra classes and styles the invalid state", () => {
    render(<Textarea aria-label="Notes" aria-invalid className="h-32" />);

    const { className } = screen.getByLabelText("Notes");
    expect(className).toContain("h-32");
    expect(className).toContain("aria-invalid:border-danger");
  });
});
