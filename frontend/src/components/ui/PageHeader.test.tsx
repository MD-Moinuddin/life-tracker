import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "./PageHeader";

describe("PageHeader", () => {
  it("renders the title as the page heading", () => {
    render(<PageHeader title="Jobs" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Jobs" }),
    ).toBeDefined();
  });

  it("renders a node title inside the heading", () => {
    render(
      <PageHeader
        title={
          <>
            <span>Warehouse</span>
            <span>Mini-job</span>
          </>
        }
      />,
    );

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toBe("WarehouseMini-job");
    expect(screen.getByText("Mini-job").closest("h1")).toBe(heading);
  });

  it("shows a subtitle when given", () => {
    render(<PageHeader title="Jobs" subtitle="Where you work" />);

    expect(screen.getByText("Where you work")).toBeDefined();
  });

  it("shows the action next to the title", () => {
    render(
      <PageHeader
        title="Jobs"
        action={<button type="button">Add job</button>}
      />,
    );

    expect(screen.getByRole("button", { name: "Add job" })).toBeDefined();
  });

  it("omits the subtitle and action when not given", () => {
    const { container } = render(<PageHeader title="Jobs" />);

    expect(container.querySelectorAll("p")).toHaveLength(0);
    expect(container.querySelectorAll("button")).toHaveLength(0);
  });
});
