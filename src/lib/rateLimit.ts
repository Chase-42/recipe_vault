import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  path?: string;
}

type RateLimitStore = Record<
  string,
  {
    count: number;
    resetTime: number;
  }
>;

// Create a global store for all rate limiters
const globalStore: Record<string, RateLimitStore> = {};

class RateLimiter {
  private store: RateLimitStore;
  public config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    const storeKey = this.getStoreKey();
    if (!globalStore[storeKey]) {
      globalStore[storeKey] = {};
    }
    this.store = globalStore[storeKey];
  }

  private getStoreKey(): string {
    return `${this.config.path ?? "default"}-${this.config.maxRequests}-${this.config.windowMs}`;
  }

  private getKey(req: NextRequest): string {
    // Use a combination of IP and path for rate limiting
    const ip = req.ip ?? req.headers.get("x-forwarded-for") ?? "unknown";
    const path = this.config.path ?? req.nextUrl.pathname;
    return `${ip}-${path}`;
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach((key) => {
      const entry = this.store[key];
      if (entry && entry.resetTime < now) {
        delete this.store[key];
      }
    });
  }

  public async check(req: NextRequest): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    this.cleanup();
    const key = this.getKey(req);
    const now = Date.now();

    if (!this.store[key] || this.store[key].resetTime < now) {
      this.store[key] = {
        count: 1,
        resetTime: now + this.config.windowMs,
      };
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: this.store[key].resetTime,
      };
    }

    if (this.store[key].count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: this.store[key].resetTime,
      };
    }

    this.store[key].count++;
    return {
      allowed: true,
      remaining: this.config.maxRequests - this.store[key].count,
      resetTime: this.store[key].resetTime,
    };
  }
}

// Create a cache for rate limiter instances
const rateLimiterCache = new Map<string, RateLimiter>();

// Default rate limiter configuration
const defaultConfig: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
};

export async function withRateLimit(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
  config?: RateLimitConfig
): Promise<NextResponse> {
  const finalConfig = config ?? defaultConfig;
  const cacheKey = `${finalConfig.path ?? "default"}-${finalConfig.maxRequests}-${finalConfig.windowMs}`;

  let limiter = rateLimiterCache.get(cacheKey);
  if (!limiter) {
    limiter = new RateLimiter(finalConfig);
    rateLimiterCache.set(cacheKey, limiter);
  }

  const { allowed, remaining, resetTime } = await limiter.check(req);

  if (!allowed) {
    const response = NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );

    // Add rate limit headers
    response.headers.set(
      "X-RateLimit-Limit",
      limiter.config.maxRequests.toString()
    );
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", resetTime.toString());
    response.headers.set(
      "Retry-After",
      Math.ceil((resetTime - Date.now()) / 1000).toString()
    );

    return response;
  }

  const response = await handler(req);

  // Add rate limit headers to successful responses
  response.headers.set(
    "X-RateLimit-Limit",
    limiter.config.maxRequests.toString()
  );
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  response.headers.set("X-RateLimit-Reset", resetTime.toString());

  return response;
}
