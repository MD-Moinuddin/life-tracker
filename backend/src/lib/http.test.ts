import type { Request } from "express";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ValidationError } from "./errors";
import { parseOrThrow, requireUserId } from "./http";

function validationFields(run: () => unknown) {
  try {
    run();
  } catch (error) {
    return (error as ValidationError).fields;
  }
  return undefined;
}

describe("parseOrThrow", () => {
  it("returns the parsed data, including transforms", () => {
    const schema = z.object({ name: z.string().trim() });

    expect(parseOrThrow(schema, { name: "  Alex  " })).toEqual({
      name: "Alex",
    });
  });

  it("throws a ValidationError that lists the messages per field", () => {
    const schema = z.object({ name: z.string().min(1, "Name is required") });

    expect(() => parseOrThrow(schema, { name: "" })).toThrow(ValidationError);

    const fields = validationFields(() => parseOrThrow(schema, { name: "" }));
    expect(fields).toEqual({ name: ["Name is required"] });
  });

  it("puts errors that belong to no field under form", () => {
    const schema = z.object({}).refine(() => false, "Nothing to update");

    const fields = validationFields(() => parseOrThrow(schema, {}));

    expect(fields).toEqual({ form: ["Nothing to update"] });
  });

  it("joins nested paths with a dot", () => {
    const schema = z.object({ address: z.object({ city: z.string() }) });

    const fields = validationFields(() =>
      parseOrThrow(schema, { address: {} }),
    );

    expect(Object.keys(fields ?? {})).toEqual(["address.city"]);
  });

  it("reports a missing body under form", () => {
    const schema = z.object({ name: z.string() });

    const fields = validationFields(() => parseOrThrow(schema, undefined));

    expect(Object.keys(fields ?? {})).toEqual(["form"]);
  });
});

describe("requireUserId", () => {
  it("returns the user id that requireAuth set", () => {
    expect(requireUserId({ userId: "user-1" } as Request)).toBe("user-1");
  });

  it("throws when requireAuth did not run", () => {
    expect(() => requireUserId({} as Request)).toThrow(
      "requireAuth must run before the handlers",
    );
  });
});
