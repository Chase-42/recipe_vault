import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import {
  AuthorizationError,
  handleApiError,
  ValidationError,
} from "~/lib/errors";
import { withRateLimit } from "~/lib/rateLimit";

interface RevalidateRequest {
  path: string;
}

// Create a shared rate limiter instance for the revalidate endpoint
const revalidateRateLimiter = {
  maxRequests: 10,
  windowMs: 60 * 1000,
  path: "/api/revalidate",
};

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthorizationError();
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      throw new ValidationError("Path parameter is required");
    }

    revalidatePath(path);
    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (error) {
    const { error: errorMessage, statusCode } = handleApiError(error);
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(
    req,
    async (req: NextRequest): Promise<NextResponse> => {
      try {
        const { userId } = await auth();
        if (!userId) {
          throw new AuthorizationError();
        }

        const body = (await req.json()) as RevalidateRequest;
        if (!body.path) {
          throw new ValidationError("Path is required");
        }

        revalidatePath(body.path);
        return NextResponse.json({ revalidated: true });
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        );
      }
    },
    revalidateRateLimiter
  );
}
