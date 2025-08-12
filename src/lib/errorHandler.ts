import { toast } from "sonner";
import {
  RecipeError,
  ValidationError,
  AuthorizationError,
  NotFoundError,
} from "./errors";
import { logger } from "./logger";

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
}

/**
 * Standardized error handler for consistent error handling across the app
 */
export function handleError(
  error: unknown,
  context: string,
  options: ErrorHandlerOptions = {}
): void {
  const {
    showToast = true,
    logError = true,
    fallbackMessage = "An unexpected error occurred",
  } = options;

  let message = fallbackMessage;
  const shouldShowToast = showToast;

  if (error instanceof ValidationError) {
    message = error.message;
  } else if (error instanceof AuthorizationError) {
    message = "You are not authorized to perform this action";
  } else if (error instanceof NotFoundError) {
    message = error.message;
  } else if (error instanceof RecipeError) {
    message = error.message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  // Log error for debugging
  if (logError) {
    logger.error(
      `Error in ${context}`,
      error instanceof Error ? error : new Error(String(error)),
      {
        component: context,
      }
    );
  }

  // Show toast notification
  if (shouldShowToast) {
    toast.error(message);
  }
}

/**
 * Async error handler for promises
 */
export async function handleAsyncError<T>(
  promise: Promise<T>,
  context: string,
  options?: ErrorHandlerOptions
): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    handleError(error, context, options);
    return null;
  }
}

/**
 * Error boundary fallback component props
 */
export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

/**
 * Standard error messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  VALIDATION_ERROR: "Please check your input and try again.",
  SERVER_ERROR: "Server error. Please try again later.",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
  IMAGE_UPLOAD_FAILED: "Failed to upload image. Please try again.",
} as const;
