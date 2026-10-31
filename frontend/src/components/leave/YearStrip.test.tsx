import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeLeave } from "../../test/fixtures";
import { YearStrip, YearSwitch } from "./YearStrip";
import source from "./YearStrip.tsx?raw";

const march = makeLeave({ id: "a" });
const december = makeLeave({
  id: "b",
  startDate: "2026-12-28",
  endDate: "2026-12-29",
});

describe("YearStrip", () => {
  it("lists the periods in its label", () => {
    render(
      <YearStrip year={2026} leave={[december, march]} today="2026-10-07" />,
    );

    expect(
      screen.getByRole("img", {
        name: "Your paid leave in 2026: 9 Mar to 13 Mar, 28 Dec to 29 Dec",
      }),
    ).toBeDefined();
  });

  it("says when nothing is booked", () => {
    render(<YearStrip year={2026} leave={[]} today="2026-10-07" />);

    expect(
      screen.getByRole("img", { name: "No paid leave booked in 2026" }),
    ).toBeDefined();
  });

  it("draws one block per leave, placed by the share of the year", () => {
    render(<YearStrip year={2026} leave={[march]} today="2026-10-07" />);

    const blocks = document.querySelectorAll("[data-block]");
    expect(blocks).toHaveLength(1);
    const style = (blocks[0] as HTMLElement).style;
    // 9 March is day 68 of 365; five days wide.
    expect(parseFloat(style.left)).toBeCloseTo((67 / 365) * 100, 1);
    expect(parseFloat(style.width)).toBeCloseTo((5 / 365) * 100, 1);
  });

  it("marks leave from today on as planned, and earlier leave as taken", () => {
    render(
      <YearStrip year={2026} leave={[march, december]} today="2026-10-07" />,
    );

    expect(
      document.querySelector("[data-block='a']")?.getAttribute("data-planned"),
    ).toBe("false");
    expect(
      document.querySelector("[data-block='b']")?.getAttribute("data-planned"),
    ).toBe("true");
  });

  it("clips leave that reaches into another year", () => {
    const crossing = makeLeave({
      id: "c",
      startDate: "2026-12-28",
      endDate: "2027-01-05",
    });
    render(<YearStrip year={2026} leave={[crossing]} today="2026-10-07" />);

    const style = (document.querySelector("[data-block]") as HTMLElement).style;
    expect(parseFloat(style.left) + parseFloat(style.width)).toBeCloseTo(
      100,
      1,
    );
  });

  it("puts the today marker in the year, and none in another year", () => {
    const { rerender } = render(
      <YearStrip year={2026} leave={[]} today="2026-10-07" />,
    );
    const marker = document.querySelector("[data-today]") as HTMLElement;
    expect(parseFloat(marker.style.left)).toBeCloseTo((279 / 365) * 100, 1);

    rerender(<YearStrip year={2027} leave={[]} today="2026-10-07" />);
    expect(document.querySelector("[data-today]")).toBeNull();
  });

  it("labels the months", () => {
    render(<YearStrip year={2026} leave={[]} today="2026-10-07" />);

    expect(screen.getByText("Jan")).toBeDefined();
    expect(screen.getByText("Dec")).toBeDefined();
  });
});

describe("YearSwitch", () => {
  it("offers the given years, with the shown one pressed", () => {
    render(
      <YearSwitch year={2026} years={[2025, 2026, 2027]} onChange={() => {}} />,
    );

    const years = ["2025", "2026", "2027"].map((name) =>
      screen.getByRole("button", { name }),
    );
    expect(years.map((button) => button.getAttribute("aria-pressed"))).toEqual([
      "false",
      "true",
      "false",
    ]);
    expect(years[0]?.className).toContain("min-h-11");
  });

  it("switches year", () => {
    const onChange = vi.fn();
    render(<YearSwitch year={2026} years={[2026, 2027]} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "2027" }));

    expect(onChange).toHaveBeenCalledWith(2027);
  });

  it("uses design tokens only, no raw palette classes", () => {
    expect(source).not.toMatch(/\b(slate|indigo|red|gray|amber|teal)-\d/);
  });
});
