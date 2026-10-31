import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useToast } from "../../hooks/useToast";
import { ToastProvider } from "./ToastProvider";

function Buttons() {
  const toast = useToast();
  return (
    <>
      <button type="button" onClick={() => toast.show("Shift added")}>
        Add
      </button>
      <button type="button" onClick={() => toast.show("Shift deleted")}>
        Delete
      </button>
    </>
  );
}

function renderToasts() {
  return render(
    <ToastProvider>
      <Buttons />
    </ToastProvider>,
  );
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ToastProvider", () => {
  it("has an empty status region on the page from the start, so messages are announced", () => {
    renderToasts();

    const region = screen.getByRole("status");
    expect(region.getAttribute("aria-live")).toBe("polite");
    expect(region.textContent).toBe("");
  });

  it("shows a message when asked", () => {
    renderToasts();

    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByRole("status").textContent).toBe("Shift added");
  });

  it("replaces the message on screen with the newest one", () => {
    renderToasts();

    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(screen.getByRole("status").textContent).toBe("Shift deleted");
  });

  it("goes away on its own after a few seconds", () => {
    renderToasts();
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    act(() => vi.advanceTimersByTime(3900));
    expect(screen.getByRole("status").textContent).toBe("Shift added");

    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("starts the wait again when a new message replaces the old one", () => {
    renderToasts();
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    act(() => vi.advanceTimersByTime(3000));

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    act(() => vi.advanceTimersByTime(3000));

    expect(screen.getByRole("status").textContent).toBe("Shift deleted");
  });

  it("sits above the phone's tab bar and lets clicks through to the page", () => {
    renderToasts();

    const { className } = screen.getByRole("status");
    expect(className).toContain(
      "max-md:bottom-[calc(var(--spacing-tabbar)+1rem)]",
    );
    expect(className).toContain("pointer-events-none");
  });
});

describe("useToast without a provider", () => {
  it("does nothing instead of failing", () => {
    render(<Buttons />);

    expect(() =>
      fireEvent.click(screen.getByRole("button", { name: "Add" })),
    ).not.toThrow();
  });
});
