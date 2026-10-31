import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DialogBody, DialogFooter } from "./DialogParts";

describe("DialogBody", () => {
  it("scrolls on its own and takes the room the footer leaves", () => {
    render(
      <DialogBody>
        <p>Fields</p>
      </DialogBody>,
    );

    const { className } = screen.getByText("Fields")
      .parentElement as HTMLElement;
    expect(className).toContain("overflow-y-auto");
    expect(className).toContain("flex-auto");
    expect(className).toContain("min-h-0");
  });

  it("sizes to its content, not from a basis of 0, which Safari on iPhone collapses", () => {
    render(
      <DialogBody>
        <p>Fields</p>
      </DialogBody>,
    );

    const { className } = screen.getByText("Fields")
      .parentElement as HTMLElement;
    expect(className.split(" ")).not.toContain("flex-1");
  });
});

describe("DialogFooter", () => {
  it("holds the actions apart from the scrolling body, with a line above", () => {
    render(
      <DialogFooter>
        <button type="button">Cancel</button>
        <button type="button">Save</button>
      </DialogFooter>,
    );

    const { className } = screen.getByRole("button", { name: "Cancel" })
      .parentElement as HTMLElement;
    expect(className).toContain("shrink-0");
    expect(className).toContain("border-t");
    expect(className).toContain("justify-end");
  });

  it("stacks the buttons full width on a phone, with the first one last", () => {
    render(
      <DialogFooter>
        <button type="button">Cancel</button>
        <button type="button">Save</button>
      </DialogFooter>,
    );

    const { className } = screen.getByRole("button", { name: "Cancel" })
      .parentElement as HTMLElement;
    expect(className).toContain("max-sm:flex-col-reverse");
    expect(className).toContain("max-sm:*:w-full");
  });

  it("keeps clear of the home indicator on a phone", () => {
    render(
      <DialogFooter>
        <button type="button">Save</button>
      </DialogFooter>,
    );

    expect(
      (screen.getByRole("button").parentElement as HTMLElement).className,
    ).toContain("safe-area-inset-bottom");
  });
});
