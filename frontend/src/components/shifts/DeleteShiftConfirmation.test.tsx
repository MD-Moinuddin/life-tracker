import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CONFIRM_DESCRIPTION_ID } from "../ConfirmDelete";
import { makeShift } from "../../test/fixtures";
import { DeleteShiftConfirmation } from "./DeleteShiftConfirmation";

const shift = makeShift({ notes: null });

function renderConfirm(onConfirm = vi.fn().mockResolvedValue(undefined)) {
  const onCancel = vi.fn();
  render(
    <DeleteShiftConfirmation
      shift={shift}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  );
  return { onConfirm, onCancel };
}

describe("DeleteShiftConfirmation", () => {
  it("shows the shift as it appears in the list, so the visitor sees what goes", () => {
    renderConfirm();

    const row = screen.getByRole("listitem");
    expect(row.textContent).toContain("Warehouse");
    expect(row.textContent).toContain("Sat 3 Oct, 09:00 to 17:00");
    expect(row.textContent).toContain("€96.00");
  });

  it("has no menu on the shown shift, and no Today label", () => {
    renderConfirm();

    expect(screen.queryByRole("button", { name: /^Actions for/ })).toBeNull();
    expect(screen.queryByText("Today")).toBeNull();
  });

  it("says what happens and that it cannot be undone, as the dialog's description", () => {
    renderConfirm();

    const description = document.getElementById(CONFIRM_DESCRIPTION_ID);
    expect(description?.textContent).toContain(
      "This shift will be removed from your list and your totals.",
    );
    expect(description?.textContent).toContain("This cannot be undone.");
  });

  it("deletes with a button named Delete shift", async () => {
    const { onConfirm } = renderConfirm();

    fireEvent.click(screen.getByRole("button", { name: "Delete shift" }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });

  it("marks Cancel as the button to focus first", () => {
    renderConfirm();

    expect(
      screen
        .getByRole("button", { name: "Cancel" })
        .hasAttribute("data-autofocus"),
    ).toBe(true);
  });
});
