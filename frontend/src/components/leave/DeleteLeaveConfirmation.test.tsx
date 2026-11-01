import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/api-client";
import { makeLeave } from "../../test/fixtures";
import { DeleteLeaveConfirmation } from "./DeleteLeaveConfirmation";
import source from "./DeleteLeaveConfirmation.tsx?raw";

function renderConfirmation(onConfirm = vi.fn().mockResolvedValue(undefined)) {
  const onCancel = vi.fn();
  render(
    <DeleteLeaveConfirmation
      leave={makeLeave()}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  );
  return { onConfirm, onCancel };
}

describe("DeleteLeaveConfirmation", () => {
  it("names the period, its hours and pay, and warns it cannot be undone", () => {
    renderConfirmation();

    expect(screen.getByText("9 Mar to 13 Mar")).toBeDefined();
    expect(screen.getByText("5 days · 20h · €280.00")).toBeDefined();
    expect(
      screen.getByText(/removed from your balance and your totals/),
    ).toBeDefined();
    expect(screen.getByText("This cannot be undone.")).toBeDefined();
  });

  it("focuses Cancel first", () => {
    renderConfirmation();

    expect(
      screen
        .getByRole("button", { name: "Cancel" })
        .hasAttribute("data-autofocus"),
    ).toBe(true);
  });

  it("cancels without deleting", () => {
    const { onConfirm, onCancel } = renderConfirmation();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("deletes when confirmed", () => {
    const { onConfirm } = renderConfirmation();

    fireEvent.click(screen.getByRole("button", { name: "Delete paid leave" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("shows a failure inside the dialog", async () => {
    renderConfirmation(
      vi.fn().mockRejectedValue(new ApiError(500, "Server down")),
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete paid leave" }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeDefined());
  });

  it("uses design tokens only, no raw palette classes", () => {
    expect(source).not.toMatch(/\b(slate|indigo|red|gray|amber|teal)-\d/);
  });
});
