// Retry configuration options
export interface RetryOptions {
  maxAttempts: number;
  delay: number;
  exponentialBackoff?: boolean;
  maxDelay?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

// Default retry configuration
const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  delay: 1000,
  exponentialBackoff: true,
  maxDelay: 30000,
  shouldRetry: (error: unknown, _attempt: number) => {
    // Don't retry on 4xx errors, retry on 5xx and network errors
    if (error instanceof Error && "status" in error) {
      const status = (error as { status: number }).status;
      return status >= 500 || status === 0;
    }
    return true;
  },
};

// Calculates the delay for a given attempt
function calculateDelay(attempt: number, options: RetryOptions): number {
  if (!options.exponentialBackoff) {
    return options.delay;
  }

  const exponentialDelay = options.delay * 2 ** (attempt - 1);
  return Math.min(exponentialDelay, options.maxDelay ?? 30000);
}

// Retries an async function with configurable options
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

  throw lastError;
}

// Creates a retry wrapper for a function
export function createRetryWrapper<
  T extends (...args: unknown[]) => Promise<unknown>,
>(fn: T, options: Partial<RetryOptions> = {}): T {
  return ((...args: Parameters<T>) => {
    return withRetry(() => fn(...args), options);
  }) as T;
}
