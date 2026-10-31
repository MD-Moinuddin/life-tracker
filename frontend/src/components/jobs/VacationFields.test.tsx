import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { VacationFields, type VacationValue } from "./VacationFields";
import source from "./VacationFields.tsx?raw";

const OFF: VacationValue = {
  enabled: false,
  hoursPerYear: "",
  carriedOverHours: "",
};

function Harness({
  initial = OFF,
  errors = {},
}: {
  initial?: VacationValue;
  errors?: { hoursPerYear?: string[]; carriedOverHours?: string[] };
}) {
  const [value, setValue] = useState(initial);
  return (
    <VacationFields
      value={value}
      onChange={setValue}
      disabled={false}
      errors={errors}
    />
  );
}

function turnOn() {
  fireEvent.click(screen.getByRole("switch", { name: "Track paid vacation" }));
}

describe("VacationFields", () => {
  it("is off by default and shows nothing but the switch", () => {
    render(<Harness />);

    const toggle = screen.getByRole("switch", {
      name: "Track paid vacation",
    }) as HTMLInputElement;
    expect(toggle.checked).toBe(false);
    expect(screen.getByText("Paid vacation")).toBeDefined();
    expect(
      screen.getByText("Track the leave you can take with pay"),
    ).toBeDefined();
    expect(screen.queryByLabelText("Hours per year")).toBeNull();
    expect(screen.queryByText(/Not sure\?/)).toBeNull();
    expect(screen.queryByLabelText(/Carried over/)).toBeNull();
  });

  it("shows the fields, the calculator and the hints when turned on", () => {
    render(<Harness />);
    turnOn();

    const hours = screen.getByLabelText("Hours per year") as HTMLInputElement;
    expect(hours.getAttribute("inputmode")).toBe("decimal");
    expect(screen.getByText(/Not sure\?/)).toBeDefined();
    expect(
      screen.getByText(
        "Your contract may give more than four weeks. Enter what it says.",
      ),
    ).toBeDefined();
    const carry = screen.getByLabelText(
      "Carried over from last year (optional)",
    ) as HTMLInputElement;
    expect(carry.value).toBe("");
    expect(
      screen.getByText("These hours often expire on 31 March."),
    ).toBeDefined();
  });

  it.each([
    ["20", "80h"],
    ["22", "88h"],
    ["22.5", "90h"],
  ])("calculates %s hours a week as %s", (weekly, result) => {
    render(<Harness />);
    turnOn();

    fireEvent.change(screen.getByLabelText("Hours per week"), {
      target: { value: weekly },
    });

    expect(screen.getByText(result)).toBeDefined();
  });

  it("copies the result into Hours per year with Use this", () => {
    render(<Harness />);
    turnOn();

    fireEvent.change(screen.getByLabelText("Hours per week"), {
      target: { value: "22,5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Use this" }));

    expect(
      (screen.getByLabelText("Hours per year") as HTMLInputElement).value,
    ).toBe("90");
  });

  it("disables Use this when the weekly hours are empty, invalid or give more than 1000", () => {
    render(<Harness />);
    turnOn();
    const button = screen.getByRole("button", {
      name: "Use this",
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("Hours per week"), {
      target: { value: "abc" },
    });
    expect(button.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("Hours per week"), {
      target: { value: "300" },
    });
    expect(button.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("Hours per week"), {
      target: { value: "250" },
    });
    expect(button.disabled).toBe(false);
  });

  it("starts on, with its hours, when the job already tracks vacation", () => {
    render(
      <Harness
        initial={{
          enabled: true,
          hoursPerYear: "80.00",
          carriedOverHours: "8",
        }}
      />,
    );

    expect((screen.getByRole("switch") as HTMLInputElement).checked).toBe(true);
    expect(
      (screen.getByLabelText("Hours per year") as HTMLInputElement).value,
    ).toBe("80.00");
  });

  it("shows the errors it is given next to the fields", () => {
    render(
      <Harness
        initial={{ enabled: true, hoursPerYear: "x", carriedOverHours: "y" }}
        errors={{
          hoursPerYear: ["Bad hours"],
          carriedOverHours: ["Bad carry"],
        }}
      />,
    );

    expect(
      screen.getByLabelText("Hours per year").getAttribute("aria-invalid"),
    ).toBe("true");
    expect(screen.getByText("Bad hours")).toBeDefined();
    expect(screen.getByText("Bad carry")).toBeDefined();
  });

  it("uses design tokens only, no raw palette classes", () => {
    expect(source).not.toMatch(/\b(slate|indigo|red|gray|amber|teal)-\d/);
  });
});
