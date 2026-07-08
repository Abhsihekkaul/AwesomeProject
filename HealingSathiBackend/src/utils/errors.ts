export class AppError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code: string, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Not authenticated") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Not allowed to perform this action") {
    super(message, "FORBIDDEN", 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, "NOT_FOUND", 404);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid input") {
    super(message, "VALIDATION_ERROR", 400);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflicting state") {
    super(message, "CONFLICT", 409);
  }
}

export class NotImplementedError extends AppError {
  constructor(message = "Not implemented yet") {
    super(message, "NOT_IMPLEMENTED", 501);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Too many attempts — please try again later") {
    super(message, "TOO_MANY_REQUESTS", 429);
  }
}
