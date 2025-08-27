/**
 * Performance monitoring utilities
 */
import { logger } from "~/lib/logger";

/**
 * Measures the execution time of a function
 */
export function measurePerformance<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();

  if (process.env.NODE_ENV === "development") {
    logger.debug(`Performance: ${name}`, {
      duration: `${(end - start).toFixed(2)}ms`,
    });
  }

  return result;
}

/**
 * Measures the execution time of an async function
 */
export async function measureAsyncPerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();

  if (process.env.NODE_ENV === "development") {
    logger.debug(`Performance: ${name}`, {
      duration: `${(end - start).toFixed(2)}ms`,
    });
  }

  return result;
}

/**
 * Creates a performance timer
 */
export function createTimer(name: string) {
  const start = performance.now();

  return {
    end: () => {
      const end = performance.now();
      const duration = end - start;

      if (process.env.NODE_ENV === "development") {
        logger.debug(`Performance: ${name}`, {
          duration: `${duration.toFixed(2)}ms`,
        });
      }

      return duration;
    },
    lap: (lapName: string) => {
      const lap = performance.now();
      const duration = lap - start;

      if (process.env.NODE_ENV === "development") {
        logger.debug(`Performance: ${name} - ${lapName}`, {
          duration: `${duration.toFixed(2)}ms`,
        });
      }

      return duration;
    },
  };
}

/**
 * Throttles a function to execute at most once per specified interval
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function throttled(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Memoizes expensive computations
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result as ReturnType<T>);

    return result;
  }) as T;
}

/**
 * Batches multiple function calls into a single execution
 */
export function batchCalls<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay = 0
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let pendingCalls: Parameters<T>[] = [];

  return function batched(...args: Parameters<T>) {
    pendingCalls.push(args);

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      const calls = [...pendingCalls];
      pendingCalls = [];
      timeoutId = null;

      // Execute with the latest arguments
      if (calls.length > 0) {
        const lastCall = calls[calls.length - 1];
        if (lastCall) {
          fn(...lastCall);
        }
      }
    }, delay);
  };
}
