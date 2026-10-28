import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SlowStartNotice } from "./SlowStartNotice";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("SlowStartNotice", () => {
  it("stays hidden while the wait is short", () => {
    render(<SlowStartNotice />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByRole("status")).toBeNull();
  });

  it("explains the wait once it gets long", () => {
    render(<SlowStartNotice />);

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.getByRole("status").textContent).toContain(
      "Waking up the server",
    );
  });
});
