import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SegmentedControl } from "./SegmentedControl";

const options = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
] as const;

function renderControl(value: "week" | "month" = "week") {
  const onChange = vi.fn();
  render(
    <SegmentedControl
      label="Summary period"
      options={options}
      value={value}
      onChange={onChange}
    />,
  );
  return { onChange };
}

describe("SegmentedControl", () => {
  it("is a group named by its label with one button per option", () => {
    renderControl();

    const group = screen.getByRole("group", { name: "Summary period" });
    expect(group.querySelectorAll("button")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Week" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Month" })).toBeDefined();
  });

  it("marks only the selected option as pressed", () => {
    renderControl("month");

    expect(
      screen
        .getByRole("button", { name: "Month" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      screen.getByRole("button", { name: "Week" }).getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it("reports the value of the option that is pressed", () => {
    const { onChange } = renderControl("week");

    fireEvent.click(screen.getByRole("button", { name: "Month" }));

    expect(onChange).toHaveBeenCalledWith("month");
  });

  it("highlights the selected option without relying on colour alone", () => {
    renderControl("week");

    const selected = screen.getByRole("button", { name: "Week" });
    const other = screen.getByRole("button", { name: "Month" });
    expect(selected.className).toContain("bg-surface");
    expect(selected.className).toContain("shadow-card");
    expect(other.className).not.toContain("bg-surface");
    expect(other.className).toContain("text-ink-muted");
  });

  it("gives the selected option a weight and ring cue", () => {
    renderControl("week");

    const selected = screen.getByRole("button", { name: "Week" });
    const other = screen.getByRole("button", { name: "Month" });
    expect(selected.className).toContain("font-semibold");
    expect(selected.className).toContain("ring-1");
    expect(selected.className).toContain("ring-control-border");
    expect(other.className).toContain("font-medium");
    expect(other.className).not.toContain("font-semibold");
    expect(other.className).not.toContain("ring-1");
  });

  it("has comfortable tap targets and no raw palette colours", () => {
    const { container } = render(
      <SegmentedControl
        label="x"
        options={options}
        value="week"
        onChange={vi.fn()}
      />,
    );

    for (const button of container.querySelectorAll("button")) {
      expect(button.className).toContain("min-h-9");
      expect(button.className).toContain("pointer-coarse:min-h-11");
    }
    expect(container.innerHTML).not.toMatch(/slate-|indigo-|red-/);
  });

  it("never submits a form", () => {
    renderControl();

    for (const button of screen.getAllByRole("button")) {
      expect(button.getAttribute("type")).toBe("button");
    }
  });

  it("draws an option's icon on a phone and keeps its label as the name", () => {
    render(
      <SegmentedControl
        label="View"
        options={[
          { value: "list", label: "List", icon: "list" },
          { value: "week", label: "Week" },
        ]}
        value="list"
        onChange={() => {}}
      />,
    );

    const list = screen.getByRole("button", { name: "List" });
    expect(list.querySelector("svg")?.getAttribute("class")).toContain(
      "sm:hidden",
    );
    expect(screen.getByText("List").className).toContain("max-sm:sr-only");
    expect(screen.getByText("Week").className).toBe("");
  });

  it("can fill the row on a phone", () => {
    render(
      <SegmentedControl
        label="Period"
        options={[
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ]}
        value="a"
        onChange={() => {}}
        fillOnPhone
      />,
    );

    expect(screen.getByRole("group").className).toContain("max-sm:flex-1");
    expect(screen.getByRole("button", { name: "A" }).className).toContain(
      "max-sm:flex-1",
    );
  });
});
