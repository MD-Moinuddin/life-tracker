import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMediaQuery } from "./useMediaQuery";

function stubMatchMedia(initial: boolean) {
  let matches = initial;
  const listeners = new Set<() => void>();
  vi.stubGlobal("matchMedia", () => ({
    get matches() {
      return matches;
    },
    addEventListener: (_: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) =>
      listeners.delete(listener),
  }));
  return (next: boolean) => {
    matches = next;
    listeners.forEach((listener) => listener());
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useMediaQuery", () => {
  it("is false when the browser has no matchMedia", () => {
    const { result } = renderHook(() => useMediaQuery("(max-width: 10px)"));

    expect(result.current).toBe(false);
  });

  it("reports whether the query matches", () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useMediaQuery("(max-width: 10px)"));

    expect(result.current).toBe(true);
  });

  it("follows the query as the window changes", () => {
    const change = stubMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery("(max-width: 10px)"));
    expect(result.current).toBe(false);

    act(() => change(true));

    expect(result.current).toBe(true);
  });
});
