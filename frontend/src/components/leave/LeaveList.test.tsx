import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeLeave } from "../../test/fixtures";
import { LeaveList } from "./LeaveList";
import source from "./LeaveList.tsx?raw";

const august = makeLeave({
  id: "aug",
  startDate: "2026-08-03",
  endDate: "2026-08-14",
});
const march = makeLeave({ id: "mar" });
const december = makeLeave({
  id: "dec",
  startDate: "2026-12-28",
  endDate: "2026-12-29",
});
const november = makeLeave({
  id: "nov",
  startDate: "2026-11-02",
  endDate: "2026-11-03",
});

function renderList(leave = [december, august, march, november]) {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  render(
    <LeaveList
      leave={leave}
      today="2026-10-07"
      onEdit={onEdit}
      onDelete={onDelete}
    />,
  );
  return { onEdit, onDelete };
}

function periods(region: HTMLElement) {
  return within(region)
    .getAllByRole("listitem")
    .map((row) => row.querySelector("p")?.textContent);
}

describe("LeaveList", () => {
  it("groups leave as Planned and Taken, each by start date", () => {
    renderList();

    const planned = screen.getByRole("region", { name: "Planned" });
    const taken = screen.getByRole("region", { name: "Taken" });
    expect(periods(planned)).toEqual(["2 Nov to 3 Nov", "28 Dec to 29 Dec"]);
    expect(periods(taken)).toEqual(["9 Mar to 13 Mar", "3 Aug to 14 Aug"]);
  });

  it("titles the list, and its groups one level below", () => {
    renderList();

    expect(
      screen.getByRole("heading", { level: 3, name: "Booked leave" }),
    ).toBeDefined();
    expect(
      screen.getAllByRole("heading", { level: 4 }).map((h) => h.textContent),
    ).toEqual(["Planned", "Taken"]);
  });

  it("leaves out a group with no leave", () => {
    renderList([march]);

    expect(screen.queryByRole("region", { name: "Planned" })).toBeNull();
    expect(screen.getByRole("region", { name: "Taken" })).toBeDefined();
  });

  it("passes the chosen leave to Edit and Delete", () => {
    const { onEdit, onDelete } = renderList();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Actions for paid leave 9 Mar to 13 Mar",
      }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalledWith(march);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Actions for paid leave 2 Nov to 3 Nov",
      }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete…" }));
    expect(onDelete).toHaveBeenCalledWith(november);
  });

  it("uses design tokens only, no raw palette classes", () => {
    expect(source).not.toMatch(/\b(slate|indigo|red|gray|amber|teal)-\d/);
  });
});
