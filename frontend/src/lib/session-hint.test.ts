import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearSessionHint,
  hasSessionHint,
  saveSessionHint,
} from "./session-hint";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("session hint", () => {
  it("is absent for a new visitor", () => {
    expect(hasSessionHint()).toBe(false);
  });

  it("is present after saving and gone after clearing", () => {
    saveSessionHint();
    expect(hasSessionHint()).toBe(true);

    clearSessionHint();
    expect(hasSessionHint()).toBe(false);
  });

  it("does not throw when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(hasSessionHint()).toBe(false);
    expect(() => saveSessionHint()).not.toThrow();
    expect(() => clearSessionHint()).not.toThrow();
  });
});
