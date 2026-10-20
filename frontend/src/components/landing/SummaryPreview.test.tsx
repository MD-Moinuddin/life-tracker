import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SummaryPreview } from "./SummaryPreview";

describe("SummaryPreview", () => {
  it("is hidden from assistive tech, because its numbers are only an example", () => {
    const { container } = render(<SummaryPreview />);

    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("shows the example figures and the job type", () => {
    const { container } = render(<SummaryPreview />);
    const text = container.textContent ?? "";

    expect(text).toContain("€226.00 earned of €420.00 planned");
    expect(text).toContain("€420.00 of €540.00 planned");
    expect(text).toContain("Mini-job");
    expect(text).toContain("Example");
  });
});
