import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAuth } from "@clerk/nextjs/server";
import { withRateLimit } from "~/lib/rateLimit";

interface RevalidateRequest {
  path: string;
}

// Create a shared rate limiter instance for the revalidate endpoint
const revalidateRateLimiter = { maxRequests: 10, windowMs: 60 * 1000, path: "/api/revalidate" };

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json(
        { error: "Path parameter is required" },
        { status: 400 }
      );
    }

    revalidatePath(path);
    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (error) {
    console.error("Revalidation failed:", error);
    return NextResponse.json(
      { error: "Failed to revalidate" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(req, async (req: NextRequest): Promise<NextResponse> => {
    try {
      const { userId } = getAuth(req);
      if (!userId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      const body = await req.json() as RevalidateRequest;
      if (!body.path) {
        return NextResponse.json(
          { error: "Path is required" },
          { status: 400 }
        );
      }

      revalidatePath(body.path);
      return NextResponse.json({ revalidated: true });
    } catch (error) {
      console.error("Revalidation error:", error);
      return NextResponse.json(
        { error: "Failed to revalidate" },
        { status: 500 }
      );
    }
  }, revalidateRateLimiter);
} 