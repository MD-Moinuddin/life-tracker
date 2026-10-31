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

  it("draws its title with the shared section heading", () => {
    renderModal(true);

    const title = screen.getByRole("heading", { level: 2, name: "Edit job" });
    expect(title.className).toContain("text-section");
  });

  it("has a close button that closes the dialog and tells the parent", () => {
    const { onClose } = renderModal(true);

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("makes the close button a 44px target", () => {
    renderModal(true);

    expect(screen.getByRole("button", { name: "Close" }).className).toContain(
      "h-11 w-11",
    );
  });

  it("is a bottom sheet on a phone and a card from sm up", () => {
    renderModal(true);

    const { className } = screen.getByRole("dialog");
    expect(className).toContain("max-sm:mt-auto");
    expect(className).toContain("max-sm:rounded-b-none");
    expect(className).toContain("max-h-[calc(100dvh-2rem)]");
  });

  it("can be described by a text on the page", () => {
    render(
      <Modal open title="Delete job?" describedBy="why" onClose={vi.fn()}>
        <p id="why">This cannot be undone.</p>
      </Modal>,
    );

    expect(
      screen.getByRole("dialog", { description: "This cannot be undone." }),
    ).toBeDefined();
  });

  it("focuses the first field when it opens, not the close button", () => {
    render(
      <Modal open title="Add a job" onClose={vi.fn()}>
        <input aria-label="Name" />
      </Modal>,
    );

    expect(document.activeElement).toBe(screen.getByLabelText("Name"));
  });

  it("focuses the element marked data-autofocus first, such as Cancel", () => {
    render(
      <Modal open title="Delete job?" onClose={vi.fn()}>
        <button type="button" data-autofocus>
          Cancel
        </button>
        <input aria-label="Name" />
      </Modal>,
    );

    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Cancel" }),
    );
  });

  it("uses the design tokens, not raw palette colours", () => {
    renderModal(true);

    const { className } = screen.getByRole("dialog");
    expect(className).toContain("bg-surface");
    expect(className).toContain("rounded-card");
    expect(className).not.toMatch(/slate-|indigo-|red-/);
  });
});
