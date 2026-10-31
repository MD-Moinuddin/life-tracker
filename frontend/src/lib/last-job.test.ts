import { afterEach, describe, expect, it, vi } from "vitest";
import { readLastJobId, saveLastJobId } from "./last-job";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("last job", () => {
  it("is nothing until a job has been saved", () => {
    expect(readLastJobId()).toBeNull();
  });

  it("remembers the job that was saved", () => {
    saveLastJobId("job-2");

    expect(readLastJobId()).toBe("job-2");
  });

  it("replaces the job with the next one", () => {
    saveLastJobId("job-1");
    saveLastJobId("job-2");

    expect(readLastJobId()).toBe("job-2");
  });

  it("copes with storage that is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => saveLastJobId("job-1")).not.toThrow();
    expect(readLastJobId()).toBeNull();
  });
});
