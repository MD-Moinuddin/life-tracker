import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button, buttonClassName } from "./Button";

describe("Button", () => {
  it("is a plain button, not a submit button, by default", () => {
    render(<Button>Save</Button>);

    expect(
      screen.getByRole("button", { name: "Save" }).getAttribute("type"),
    ).toBe("button");
  });

  it("can be a submit button", () => {
    render(<Button type="submit">Save</Button>);

    expect(
      screen.getByRole("button", { name: "Save" }).getAttribute("type"),
    ).toBe("submit");
  });

  it("calls onClick", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("looks different for each variant", () => {
    const { rerender } = render(<Button variant="primary">Go</Button>);
    expect(screen.getByRole("button").className).toContain("bg-accent");

    rerender(<Button variant="secondary">Go</Button>);
    expect(screen.getByRole("button").className).toContain(
      "border-border-strong",
    );

    rerender(<Button variant="danger">Go</Button>);
    expect(screen.getByRole("button").className).toContain("bg-danger");
  });

  it("has a smaller compact size that still reaches 44px on touch screens", () => {
    render(<Button size="compact">Edit</Button>);

    const { className } = screen.getByRole("button");
    expect(className).toContain("min-h-9");
    expect(className).toContain("pointer-coarse:min-h-11");
  });

  it("is disabled and busy while loading, and ignores clicks", () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Saving…
      </Button>,
    );

    const button = screen.getByRole("button", { name: /Saving/ });
    fireEvent.click(button);

    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(onClick).not.toHaveBeenCalled();
  });

  it("is not marked busy when it is not loading", () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole("button").getAttribute("aria-busy")).toBeNull();
  });

  it("can be disabled", () => {
    render(<Button disabled>Save</Button>);

    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("shows the spinner before the label only while loading", () => {
    const { container, rerender } = render(<Button loading>Saving</Button>);

    const spinner = container.querySelector(".animate-spin");
    expect(spinner).not.toBeNull();
    expect(screen.getByRole("button").firstElementChild).toBe(spinner);

    rerender(<Button>Saving</Button>);
    expect(container.querySelector(".animate-spin")).toBeNull();
  });

  it("stays busy while loading even if the caller passes aria-busy=false", () => {
    render(
      <Button loading aria-busy={false}>
        Saving
      </Button>,
    );

    expect(screen.getByRole("button").getAttribute("aria-busy")).toBe("true");
  });
});

describe("buttonClassName", () => {
  it("returns the primary normal classes by default", () => {
    const classes = buttonClassName();

    expect(classes).toContain("bg-accent");
    expect(classes).toContain("min-h-11");
  });

  it("differs per variant and size", () => {
    expect(buttonClassName("danger")).toContain("bg-danger");
    expect(buttonClassName("secondary")).toContain("border-border-strong");
    expect(buttonClassName("primary", "compact")).toContain("min-h-9");
    expect(buttonClassName("primary", "compact")).not.toBe(buttonClassName());
  });

  it("appends extra classes", () => {
    expect(buttonClassName("primary", "normal", "mt-4")).toContain("mt-4");
  });
});
