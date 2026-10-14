export type FieldErrors = Record<string, string[]>;

export class AppError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
    readonly fields?: FieldErrors,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(fields: FieldErrors) {
    super(400, "Validation failed", fields);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(409, message);
  }
}
