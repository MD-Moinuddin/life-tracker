import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AccountMenu } from "./AccountMenu";

function renderMenu(props: { email?: string } = {}) {
  const onLogout = vi.fn();
  render(
    <div>
      <AccountMenu name="Md Moinuddin" onLogout={onLogout} {...props} />
      <button type="button">Outside</button>
    </div>,
  );
  return { onLogout };
}

function trigger() {
  return screen.getByRole("button", { name: /^Account menu: Md Moinuddin$/ });
}

describe("AccountMenu", () => {
  it("is closed at first", () => {
    renderMenu();

    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(trigger().getAttribute("aria-controls")).toBeNull();
    expect(screen.queryByRole("button", { name: "Log out" })).toBeNull();
  });

  it("shows the initial in a decorative circle", () => {
    renderMenu();

    const initial = screen.getByText("M", { selector: "span" });
    expect(initial.getAttribute("aria-hidden")).toBe("true");
  });

  it("opens on press and links the trigger to the panel", () => {
    renderMenu({ email: "md@example.com" });

    fireEvent.click(trigger());

    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    const panelId = trigger().getAttribute("aria-controls");
    expect(panelId).not.toBeNull();
    expect(document.getElementById(panelId as string)).not.toBeNull();
    expect(screen.getByText("md@example.com")).toBeDefined();
    expect(screen.getByRole("button", { name: "Log out" })).toBeDefined();
  });

  it("does not show an email line when there is no email", () => {
    renderMenu();

    fireEvent.click(trigger());

    expect(screen.queryByText(/@/)).toBeNull();
  });

  it("closes when the trigger is pressed again", () => {
    renderMenu();

    fireEvent.click(trigger());
    fireEvent.click(trigger());

    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("button", { name: "Log out" })).toBeNull();
  });

  it("closes on Escape and gives focus back to the trigger", () => {
    renderMenu();
    fireEvent.click(trigger());
    screen.getByRole("button", { name: "Log out" }).focus();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("button", { name: "Log out" })).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it("closes when the pointer is pressed outside", () => {
    renderMenu();
    fireEvent.click(trigger());

    fireEvent.pointerDown(screen.getByRole("button", { name: "Outside" }));

    expect(screen.queryByRole("button", { name: "Log out" })).toBeNull();
  });

  it("stays open when the pointer is pressed inside the panel", () => {
    renderMenu({ email: "md@example.com" });
    fireEvent.click(trigger());

    fireEvent.pointerDown(screen.getByText("md@example.com"));

    expect(screen.getByRole("button", { name: "Log out" })).toBeDefined();
  });

  it("calls onLogout and closes when Log out is pressed", () => {
    const { onLogout } = renderMenu();
    fireEvent.click(trigger());

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Log out" })).toBeNull();
  });
});
