import { ApiError } from "./api-client";
import type { FieldErrors } from "./api-client";

const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";

export function toErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : GENERIC_ERROR_MESSAGE;
}

export function toFormErrors(error: unknown): FieldErrors {
  if (error instanceof ApiError && Object.keys(error.fields).length > 0) {
    return error.fields;
  }
  return { form: [toErrorMessage(error)] };
}
