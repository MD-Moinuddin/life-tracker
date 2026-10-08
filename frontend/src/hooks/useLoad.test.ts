import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useLoad } from "./useLoad";

type Loader = () => Promise<string>;

describe("useLoad", () => {
  it("is loading first, then ready with the data", async () => {
    const load: Loader = () => Promise.resolve("jobs");

    const { result } = renderHook(() => useLoad(load));

    expect(result.current.state).toEqual({ status: "loading" });
    await waitFor(() =>
      expect(result.current.state).toEqual({ status: "ready", data: "jobs" }),
    );
  });

  it("reports an error when the request fails", async () => {
    const load: Loader = () => Promise.reject(new Error("network down"));

    const { result } = renderHook(() => useLoad(load));

    await waitFor(() =>
      expect(result.current.state).toEqual({ status: "error" }),
    );
  });

  it("starts a new request, and shows loading, when load changes", async () => {
    const first: Loader = () => Promise.resolve("week 1");
    const second: Loader = () => Promise.resolve("week 2");
    const { result, rerender } = renderHook(
      ({ load }: { load: Loader }) => useLoad(load),
      { initialProps: { load: first } },
    );
    await waitFor(() =>
      expect(result.current.state).toEqual({ status: "ready", data: "week 1" }),
    );

    rerender({ load: second });

    expect(result.current.state).toEqual({ status: "loading" });
    await waitFor(() =>
      expect(result.current.state).toEqual({ status: "ready", data: "week 2" }),
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
      expect(result.current.state).toEqual({ status: "ready", data: "new" }),
    );
    resolveFirst("old");
    await Promise.resolve();

    expect(result.current.state).toEqual({ status: "ready", data: "new" });
  });

  it("reload fetches again and keeps the old data until the new data arrives", async () => {
    let calls = 0;
    const load: Loader = () => Promise.resolve(`call ${++calls}`);
    const { result } = renderHook(() => useLoad(load));
    await waitFor(() =>
      expect(result.current.state).toEqual({ status: "ready", data: "call 1" }),
    );

    act(() => result.current.reload());

    expect(result.current.state).toEqual({ status: "ready", data: "call 1" });
    await waitFor(() =>
      expect(result.current.state).toEqual({ status: "ready", data: "call 2" }),
    );
  });

  it("reload tries again after a failure", async () => {
    let calls = 0;
    const load: Loader = () =>
      ++calls === 1 ? Promise.reject(new Error("down")) : Promise.resolve("ok");
    const { result } = renderHook(() => useLoad(load));
    await waitFor(() =>
      expect(result.current.state).toEqual({ status: "error" }),
    );

    act(() => result.current.reload());

    await waitFor(() =>
      expect(result.current.state).toEqual({ status: "ready", data: "ok" }),
    );
  });

  describe("keepPreviousData", () => {
    const first: Loader = () => Promise.resolve("week 1");

    it("keeps showing the old data, flagged stale, until the new data arrives", async () => {
      let resolveSecond: (value: string) => void = () => {};
      const second: Loader = () =>
        new Promise<string>((resolve) => {
          resolveSecond = resolve;
        });
      const { result, rerender } = renderHook(
        ({ load }: { load: Loader }) =>
          useLoad(load, { keepPreviousData: true }),
        { initialProps: { load: first } },
      );
      await waitFor(() =>
        expect(result.current.state).toEqual({
          status: "ready",
          data: "week 1",
        }),
      );
      expect(result.current.isStale).toBe(false);

      rerender({ load: second });

      expect(result.current.state).toEqual({ status: "ready", data: "week 1" });
      expect(result.current.isStale).toBe(true);

      act(() => resolveSecond("week 2"));
      await waitFor(() =>
        expect(result.current.state).toEqual({
          status: "ready",
          data: "week 2",
        }),
      );
      expect(result.current.isStale).toBe(false);
    });

    it("shows loading, not stale data, when there is nothing to keep yet", () => {
      const { result } = renderHook(() =>
        useLoad(first, { keepPreviousData: true }),
      );

      expect(result.current.state).toEqual({ status: "loading" });
      expect(result.current.isStale).toBe(false);
    });

    it("shows loading after an error rather than keeping the failed state", async () => {
      const failing: Loader = () => Promise.reject(new Error("down"));
      const never: Loader = () => new Promise<string>(() => {});
      const { result, rerender } = renderHook(
        ({ load }: { load: Loader }) =>
          useLoad(load, { keepPreviousData: true }),
        { initialProps: { load: failing } },
      );
      await waitFor(() =>
        expect(result.current.state).toEqual({ status: "error" }),
      );

      rerender({ load: never });

      expect(result.current.state).toEqual({ status: "loading" });
    });
  });
});
