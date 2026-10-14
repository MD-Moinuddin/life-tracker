import type { Request } from "express";
import type { ZodError, ZodType } from "zod";
import { ValidationError } from "./errors";
import type { FieldErrors } from "./errors";

export function requireUserId(req: Request): string {
  if (!req.userId) {
    throw new Error("requireAuth must run before the handlers");
  }
  return req.userId;
}

function toFieldErrors(error: ZodError): FieldErrors {
  const fields: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    (fields[key] ??= []).push(issue.message);
  }
  return fields;
}

export function parseOrThrow<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(toFieldErrors(result.error));
  }
  return result.data;
}
