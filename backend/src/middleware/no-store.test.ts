import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { noStore } from "./no-store";

describe("noStore", () => {
  it("sets Cache-Control to no-store and continues", () => {
    const res = { set: vi.fn() } as unknown as Response;
    const next = vi.fn();

    noStore({} as Request, res, next as unknown as NextFunction);

    expect(res.set).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(next).toHaveBeenCalledTimes(1);
  });
});
