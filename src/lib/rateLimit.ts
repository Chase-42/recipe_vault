import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  path?: string;
}

function getKey(req: NextRequest, config: RateLimitConfig): string {
  const ip =
    req.headers.get("x-forwarded-for") ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const path = config.path ?? req.nextUrl.pathname;
  const storeKey = `${config.path ?? "default"}-${config.maxRequests}-${config.windowMs}`;
  return `ratelimit:${storeKey}:${ip}:${path}`;
}

async function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig
): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
}> {
  const key = getKey(req, config);
  const now = Date.now();
  const resetTime = now + config.windowMs;
  const windowSeconds = Math.ceil(config.windowMs / 1000);

  try {
    const count = await kv.incr(key);
    
    if (count === 1) {
      await kv.expire(key, windowSeconds);
    }

    const remaining = Math.max(0, config.maxRequests - count);

    return {
      allowed: count <= config.maxRequests,
      remaining,
      resetTime,
    };
  } catch (error) {
    console.error("Rate limit KV error:", error);
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime,
    };
  }
}

const defaultConfig: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60 * 1000,
};

export async function withRateLimit(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
  config?: RateLimitConfig
): Promise<NextResponse> {
  const finalConfig = config ?? defaultConfig;
  const { allowed, remaining, resetTime } = await checkRateLimit(req, finalConfig);

  if (!allowed) {
    const response = NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );

    response.headers.set(
      "X-RateLimit-Limit",
      finalConfig.maxRequests.toString()
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

  response.headers.set(
    "X-RateLimit-Limit",
    finalConfig.maxRequests.toString()
  );
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  response.headers.set("X-RateLimit-Reset", resetTime.toString());

  return response;
}
