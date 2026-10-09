import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Cell, HeaderCell, RowHeader, Table } from "./Table";

function renderTable() {
  render(
    <Table caption="Hours and earnings per job">
      <thead>
        <tr>
          <HeaderCell>Job</HeaderCell>
          <HeaderCell align="right">Earned</HeaderCell>
        </tr>
      </thead>
      <tbody>
        <tr>
          <RowHeader>Warehouse</RowHeader>
          <Cell align="right">€96.00</Cell>
        </tr>
      </tbody>
    </Table>,
  );
}

describe("Table", () => {
  it("is a table named by its caption", () => {
    renderTable();

    expect(
      screen.getByRole("table", { name: "Hours and earnings per job" }),
    ).toBeDefined();
  });

  it("has column headers and a row header", () => {
    renderTable();

    expect(screen.getByRole("columnheader", { name: "Job" })).toBeDefined();
    expect(screen.getByRole("rowheader", { name: "Warehouse" })).toBeDefined();
  });

  it("puts the data in cells", () => {
    renderTable();

    const row = screen.getByRole("row", { name: /Warehouse/ });
    expect(within(row).getByRole("cell").textContent).toBe("€96.00");
  });

  it("right-aligns numeric columns and left-aligns the rest", () => {
    renderTable();

    expect(
      screen.getByRole("columnheader", { name: "Job" }).className,
    ).toContain("text-left");
    expect(
      screen.getByRole("columnheader", { name: "Earned" }).className,
    ).toContain("text-right");
    expect(screen.getByRole("cell").className).toContain("text-right");
  });

  it("keeps tbody row headers medium and lets tfoot row headers inherit semibold", () => {
    const { container } = render(
      <Table caption="x">
        <tbody />
        <tfoot>
          <tr>
            <RowHeader>Total</RowHeader>
          </tr>
        </tfoot>
      </Table>,
    );

    expect(container.querySelector("table")?.className).toContain(
      "[&_tbody_th]:font-medium",
    );
    expect(
      screen.getByRole("rowheader", { name: "Total" }).className,
    ).not.toContain("font-medium");
  });

  it("scrolls sideways inside its card instead of widening the page", () => {
    const { container } = render(
      <Table caption="x">
        <tbody />
      </Table>,
    );

    expect(container.firstElementChild?.className).toContain("overflow-x-auto");
  });
});
