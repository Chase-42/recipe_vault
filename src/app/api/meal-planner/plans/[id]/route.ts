import { getServerUserIdFromRequest } from "~/lib/auth-helpers";
import { type NextRequest, NextResponse } from "next/server";
import {
  AuthorizationError,
  handleApiError,
  ValidationError,
} from "~/lib/errors";
import { withRateLimit } from "~/lib/rateLimit";
import { deleteMealPlan } from "~/server/queries/meal-planner";

// Create a shared rate limiter instance for the meal plan deletion endpoint
const mealPlanDeleteRateLimiter = {
  maxRequests: 10,
  windowMs: 60 * 1000,
  path: "/api/meal-planner/plans/[id]",
};

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return withRateLimit(
    req,
    async (req: NextRequest): Promise<NextResponse> => {
      try {
        const userId = await getServerUserIdFromRequest(req);

        const { id } = await params;
        const mealPlanId = Number.parseInt(id, 10);
        if (Number.isNaN(mealPlanId)) {
          throw new ValidationError("Invalid meal plan ID");
        }

        await deleteMealPlan(userId, mealPlanId);
        return new NextResponse(null, { status: 204 });
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        );
      }
    },
    mealPlanDeleteRateLimiter
  );
}
