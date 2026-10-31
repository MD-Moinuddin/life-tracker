import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCountdown } from "./useCountdown";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useCountdown", () => {
  it("starts at the given number of seconds", () => {
    const { result } = renderHook(() => useCountdown(5));

    expect(result.current.remaining).toBe(5);
  });

  it("counts down once a second", () => {
    const { result } = renderHook(() => useCountdown(5));

    act(() => vi.advanceTimersByTime(3000));

    expect(result.current.remaining).toBe(2);
  });

  it("stops at zero", () => {
    const { result } = renderHook(() => useCountdown(2));

    act(() => vi.advanceTimersByTime(10_000));

    expect(result.current.remaining).toBe(0);
  });

  it("starts again from the beginning on restart", () => {
    const { result } = renderHook(() => useCountdown(3));
    act(() => vi.advanceTimersByTime(5000));

    act(() => result.current.restart());
    expect(result.current.remaining).toBe(3);

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.remaining).toBe(2);
  });
});
