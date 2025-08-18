/**
 * Retry configuration options
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Delay between retries in milliseconds */
  delay: number;
  /** Whether to use exponential backoff */
  exponentialBackoff?: boolean;
  /** Maximum delay for exponential backoff */
  maxDelay?: number;
  /** Function to determine if an error should trigger a retry */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  delay: 1000,
  exponentialBackoff: true,
  maxDelay: 30000,
  shouldRetry: (error: unknown, attempt: number) => {
    // Don't retry on client errors (4xx), but retry on server errors (5xx) and network errors
    if (error instanceof Error && "status" in error) {
      const status = (error as any).status;
      return status >= 500 || status === 0; // 0 typically indicates network error
    }
    return true; // Retry on other errors
  },
};

/**
 * Calculates the delay for a given attempt
 */
function calculateDelay(attempt: number, options: RetryOptions): number {
  if (!options.exponentialBackoff) {
    return options.delay;
  }

  const exponentialDelay = options.delay * Math.pow(2, attempt - 1);
  return Math.min(exponentialDelay, options.maxDelay || 30000);
}

/**
 * Retries an async function with configurable options
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (
        attempt === config.maxAttempts ||
        !config.shouldRetry?.(error, attempt)
      ) {
        throw error;
      }

      // Wait before retrying
      const delay = calculateDelay(attempt, config);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError;
}

/**
 * Creates a retry wrapper for a function
 */
export function createRetryWrapper<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: Partial<RetryOptions> = {}
): T {
  return ((...args: Parameters<T>) => {
    return withRetry(() => fn(...args), options);
  }) as T;
}
