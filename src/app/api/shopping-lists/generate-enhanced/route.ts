import { getServerUserIdFromRequest } from "~/lib/auth-helpers";
import { type NextRequest, NextResponse } from "next/server";
import {
  AuthorizationError,
  handleApiError,
  ValidationError,
} from "~/lib/errors";
import { withRateLimit } from "~/lib/rateLimit";
import { generateEnhancedShoppingListFromWeek } from "~/server/queries/shopping-list";

// Rate limiter for enhanced shopping list generation
const generateEnhancedRateLimiter = {
  maxRequests: 15,
  windowMs: 60 * 1000,
  path: "/api/shopping-lists/generate-enhanced",
};

export async function GET(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(
    req,
    async (req: NextRequest): Promise<NextResponse> => {
      try {
        const userId = await getServerUserIdFromRequest(req);

        const { searchParams } = new URL(req.url);
        const weekStart = searchParams.get("weekStart");

        if (!weekStart) {
          throw new ValidationError("weekStart query parameter is required");
        }

        const weekStartDate = new Date(weekStart);
        if (isNaN(weekStartDate.getTime())) {
          throw new ValidationError("Invalid weekStart date");
        }

        // Generate enhanced shopping list with existing items and duplicate analysis
        const result = await generateEnhancedShoppingListFromWeek(
          userId,
          weekStartDate
        );

        return NextResponse.json(result);
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        );
      }
    },
    generateEnhancedRateLimiter
  );
}
