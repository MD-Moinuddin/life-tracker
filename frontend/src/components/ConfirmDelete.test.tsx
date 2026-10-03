import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/api-client";
import { ConfirmDelete } from "./ConfirmDelete";

function renderConfirm(
  props: Partial<ComponentProps<typeof ConfirmDelete>> = {},
) {
  const onConfirm = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();
  render(
    <ConfirmDelete
      confirmLabel="Delete job"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    >
      <p>This cannot be undone.</p>
    </ConfirmDelete>,
  );
  return { onConfirm, onCancel };
}

describe("ConfirmDelete", () => {
  it("shows what it is given, with Cancel before the delete button", () => {
    renderConfirm();

    expect(screen.getByText("This cannot be undone.")).toBeDefined();
    const names = screen
      .getAllByRole("button")
      .map((button) => button.textContent);
    expect(names).toEqual(["Cancel", "Delete job"]);
  });

  it("calls onCancel when Cancel is pressed", () => {
    const { onCancel, onConfirm } = renderConfirm();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("calls onConfirm when the delete button is pressed", async () => {
    const { onConfirm } = renderConfirm();

    fireEvent.click(screen.getByRole("button", { name: "Delete job" }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });

  it("disables both buttons while deleting", async () => {
    let finish: () => void = () => {};
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    renderConfirm({ onConfirm });

    fireEvent.click(screen.getByRole("button", { name: "Delete job" }));

    await screen.findByText("Deleting…");
    expect(
      (screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    finish();
    await waitFor(() => expect(screen.queryByText("Deleting…")).toBeNull());
  });

  it("shows the server's message when deleting fails", async () => {
    renderConfirm({
      onConfirm: vi.fn().mockRejectedValue(new ApiError(404, "Job not found")),
    });

    fireEvent.click(screen.getByRole("button", { name: "Delete job" }));

    expect(await screen.findByText("Job not found")).toBeDefined();
  });

  it("shows a generic message for unexpected errors", async () => {
    renderConfirm({
      onConfirm: vi.fn().mockRejectedValue(new Error("network down")),
    });

    fireEvent.click(screen.getByRole("button", { name: "Delete job" }));

    expect(
      await screen.findByText("Something went wrong. Please try again."),
    ).toBeDefined();
  });
});
