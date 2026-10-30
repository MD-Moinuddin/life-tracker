import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InfoPopover } from "./InfoPopover";

function renderPopover() {
  render(
    <div>
      <InfoPopover label="How it works">Some explanation.</InfoPopover>
      <button type="button">Outside</button>
    </div>,
  );
  return screen.getByRole("button", { name: "How it works" });
}

describe("InfoPopover", () => {
  it("is closed until the button is pressed", () => {
    const button = renderPopover();

    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("Some explanation.")).toBeNull();
  });

  it("opens the explanation and links it to the button", () => {
    const button = renderPopover();
    fireEvent.click(button);

    const note = screen.getByRole("note");
    expect(note.textContent).toBe("Some explanation.");
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(button.getAttribute("aria-controls")).toBe(note.id);
  });

  it("closes when the button is pressed again", () => {
    const button = renderPopover();
    fireEvent.click(button);
    fireEvent.click(button);

    expect(screen.queryByRole("note")).toBeNull();
  });

  it("closes on an outside press", () => {
    const button = renderPopover();
    fireEvent.click(button);
    fireEvent.pointerDown(screen.getByRole("button", { name: "Outside" }));

    expect(screen.queryByRole("note")).toBeNull();
  });

  it("closes on Escape and returns focus to the button", () => {
    const button = renderPopover();
    fireEvent.click(button);
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("note")).toBeNull();
    expect(document.activeElement).toBe(button);
  });
});
