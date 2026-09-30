import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";

function renderModal(open: boolean, onClose = vi.fn()) {
  const view = render(
    <Modal open={open} title="Edit job" onClose={onClose}>
      <button type="button">Inside</button>
    </Modal>,
  );
  return { ...view, onClose };
}

describe("Modal", () => {
  it("is shown, and named by its title, when open", () => {
    renderModal(true);

    expect(screen.getByRole("dialog", { name: "Edit job" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Inside" })).toBeDefined();
  });

  it("is hidden when closed", () => {
    renderModal(false);

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens and closes as the open prop changes", () => {
    const { rerender, onClose } = renderModal(false);

    rerender(
      <Modal open title="Edit job" onClose={onClose}>
        <button type="button">Inside</button>
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toBeDefined();

    rerender(
      <Modal open={false} title="Edit job" onClose={onClose}>
        <button type="button">Inside</button>
      </Modal>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("tells the parent when the browser closes it, for example with Escape", () => {
    const { onClose } = renderModal(true);

    fireEvent(screen.getByRole("dialog"), new Event("close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
