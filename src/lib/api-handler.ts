import "server-only";
import { type NextRequest, NextResponse } from "next/server";
import { handleApiError } from "~/lib/errors";
import { withRateLimit, type RateLimitConfig } from "~/lib/rateLimit";
import { getOrSetCorrelationId } from "~/lib/request-context";
import { getServerUserIdFromRequest } from "~/lib/auth-helpers";
import { apiError } from "~/lib/api-response";

type AuthedHandler = (req: NextRequest, userId: string) => Promise<NextResponse>;

export function withApiHandler(
  rateLimiter: RateLimitConfig,
  handler: AuthedHandler
): (req: NextRequest) => Promise<NextResponse> {
  return (req: NextRequest) =>
    withRateLimit(
      req,
      async (req: NextRequest): Promise<NextResponse> => {
        getOrSetCorrelationId(req);
        try {
          const userId = await getServerUserIdFromRequest(req);
          return await handler(req, userId);
        } catch (error) {
          const { error: errorMessage, statusCode } = handleApiError(error);
          return apiError(errorMessage, undefined, statusCode);
        }
      },
      rateLimiter
    );
}
