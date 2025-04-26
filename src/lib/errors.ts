// Custom error classes
export class RecipeError extends Error {
  constructor(
    message: string,
    public statusCode = 500
  ) {
    super(message);
    this.name = "RecipeError";
  }
}

export class ValidationError extends RecipeError {
  constructor(message: string) {
    super(message, 400);
    this.name = "ValidationError";
  }
}

export class AuthorizationError extends RecipeError {
  constructor(message = "Unauthorized") {
    super(message, 401);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends RecipeError {
  constructor(message = "Resource not found") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

// Error handling utilities
export function handleApiError(error: unknown): {
  error: string;
  statusCode: number;
} {
  console.error("API Error:", error);

  if (error instanceof RecipeError) {
    return {
      error: error.message,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    return {
      error: error.message,
      statusCode: 500,
    };
  }

  return {
    error: "An unexpected error occurred",
    statusCode: 500,
  };
}

// Type guard for checking if an error is a known error type
export function isRecipeError(error: unknown): error is RecipeError {
  return error instanceof RecipeError;
}

// Helper function to ensure error has a message
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred";
}
