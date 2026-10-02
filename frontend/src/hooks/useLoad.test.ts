import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useLoad } from "./useLoad";

type Loader = () => Promise<string>;

describe("useLoad", () => {
  it("is loading first, then ready with the data", async () => {
    const load: Loader = () => Promise.resolve("jobs");

    const { result } = renderHook(() => useLoad(load));

    expect(result.current).toEqual({ status: "loading" });
    await waitFor(() =>
      expect(result.current).toEqual({ status: "ready", data: "jobs" }),
    );
  });

  it("reports an error when the request fails", async () => {
    const load: Loader = () => Promise.reject(new Error("network down"));

    const { result } = renderHook(() => useLoad(load));

    await waitFor(() => expect(result.current).toEqual({ status: "error" }));
  });

  it("starts a new request, and shows loading, when load changes", async () => {
    const first: Loader = () => Promise.resolve("week 1");
    const second: Loader = () => Promise.resolve("week 2");
    const { result, rerender } = renderHook(
      ({ load }: { load: Loader }) => useLoad(load),
      { initialProps: { load: first } },
    );
    await waitFor(() =>
      expect(result.current).toEqual({ status: "ready", data: "week 1" }),
    );

    rerender({ load: second });

    expect(result.current).toEqual({ status: "loading" });
    await waitFor(() =>
      expect(result.current).toEqual({ status: "ready", data: "week 2" }),
    );
  });

  it("ignores a slow response that arrives after load has changed", async () => {
    let resolveFirst: (value: string) => void = () => {};
    const first: Loader = () =>
      new Promise<string>((resolve) => {
        resolveFirst = resolve;
      });
    const second: Loader = () => Promise.resolve("new");
    const { result, rerender } = renderHook(
      ({ load }: { load: Loader }) => useLoad(load),
      { initialProps: { load: first } },
    );

    rerender({ load: second });
    await waitFor(() =>
      expect(result.current).toEqual({ status: "ready", data: "new" }),
    );
    resolveFirst("old");
    await Promise.resolve();

    expect(result.current).toEqual({ status: "ready", data: "new" });
  });
});
