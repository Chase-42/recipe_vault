import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "~/lib/rateLimit";

// Create a shared rate limiter instance for the test endpoint
const testRateLimiter = { maxRequests: 5, windowMs: 60 * 1000, path: "/api/test" };

export async function GET(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(req, async (req: NextRequest): Promise<NextResponse> => {
    return NextResponse.json({ message: "Hello, world!" });
  }, testRateLimiter);
} 