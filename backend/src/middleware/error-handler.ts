import type { ErrorRequestHandler } from "express";
import { AppError } from "../lib/errors";

function clientErrorStatus(err: unknown): number | null {
  if (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    typeof err.status === "number" &&
    err.status >= 400 &&
    err.status < 500 &&
    "expose" in err &&
    err.expose === true
  ) {
    return err.status;
  }
  return null;
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        ...(err.fields && { fields: err.fields }),
      },
    });
    return;
  }

  const status = clientErrorStatus(err);
  if (status !== null) {
    res.status(status).json({
      error: {
        message: status === 413 ? "Request body too large" : "Invalid request",
      },
    });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { message: "Something went wrong" } });
};
