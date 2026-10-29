import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ActionMenu } from "./ActionMenu";

function renderMenu() {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  render(
    <div>
      <ActionMenu
        label="Actions for Warehouse"
        items={[
          { label: "Edit shift", onSelect: onEdit },
          { label: "Delete shift", onSelect: onDelete, tone: "danger" },
        ]}
      />
      <button type="button">Outside</button>
    </div>,
  );
  return { onEdit, onDelete };
}

const trigger = () =>
  screen.getByRole("button", { name: "Actions for Warehouse" });

describe("ActionMenu", () => {
  it("is closed at first and names its trigger", () => {
    renderMenu();

    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(trigger().getAttribute("aria-haspopup")).toBe("menu");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("opens on press, with focus on the first item", () => {
    renderMenu();

    fireEvent.click(trigger());

    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    expect(screen.getAllByRole("menuitem")).toHaveLength(2);
    expect(document.activeElement).toBe(
      screen.getByRole("menuitem", { name: "Edit shift" }),
    );
  });

  it("runs the chosen action and closes", () => {
    const { onEdit, onDelete } = renderMenu();
    fireEvent.click(trigger());

    fireEvent.click(screen.getByRole("menuitem", { name: "Delete shift" }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onEdit).not.toHaveBeenCalled();
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("moves between the items with the arrow keys, wrapping around", () => {
    renderMenu();
    fireEvent.click(trigger());
    const menu = screen.getByRole("menu");

    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(document.activeElement).toBe(
      screen.getByRole("menuitem", { name: "Delete shift" }),
    );

    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(document.activeElement).toBe(
      screen.getByRole("menuitem", { name: "Edit shift" }),
    );

    fireEvent.keyDown(menu, { key: "ArrowUp" });
    expect(document.activeElement).toBe(
      screen.getByRole("menuitem", { name: "Delete shift" }),
    );
  });

  it("closes on Escape and returns focus to the button", () => {
    renderMenu();
    fireEvent.click(trigger());

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it("closes when the user presses outside it", () => {
    renderMenu();
    fireEvent.click(trigger());

    fireEvent.pointerDown(screen.getByRole("button", { name: "Outside" }));

    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("closes on Tab so focus is not trapped", () => {
    renderMenu();
    fireEvent.click(trigger());

    fireEvent.keyDown(screen.getByRole("menu"), { key: "Tab" });

    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("draws the danger item in the danger colour", () => {
    renderMenu();
    fireEvent.click(trigger());

    expect(
      screen.getByRole("menuitem", { name: "Delete shift" }).className,
    ).toContain("text-danger");
  });
});
