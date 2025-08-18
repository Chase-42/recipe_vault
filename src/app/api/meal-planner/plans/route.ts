import { getAuth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import {
  AuthorizationError,
  handleApiError,
  ValidationError,
} from "~/lib/errors";
import { withRateLimit } from "~/lib/rateLimit";
import {
  saveCurrentWeekAsPlan,
  loadMealPlanToCurrentWeek,
  getUserMealPlans,
  deleteMealPlan,
} from "~/server/queries/meal-planner";

// Create a shared rate limiter instance for the meal plans endpoint
const mealPlansRateLimiter = {
  maxRequests: 30,
  windowMs: 60 * 1000,
  path: "/api/meal-planner/plans",
};

export async function GET(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(
    req,
    async (req: NextRequest): Promise<NextResponse> => {
      try {
        const { userId } = getAuth(req);
        if (!userId) {
          throw new AuthorizationError();
        }

        const plans = await getUserMealPlans(userId);
        return NextResponse.json(plans);
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        );
      }
    },
    mealPlansRateLimiter
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(
    req,
    async (req: NextRequest): Promise<NextResponse> => {
      try {
        const { userId } = getAuth(req);
        if (!userId) {
          throw new AuthorizationError();
        }

        const body = (await req.json()) as unknown;
        const { name, description, weekStart } = body as {
          name?: unknown;
          description?: unknown;
          weekStart?: unknown;
        };

        if (!name || typeof name !== "string") {
          throw new ValidationError("name is required and must be a string");
        }

        if (description !== undefined && typeof description !== "string") {
          throw new ValidationError("description must be a string if provided");
        }

        const planId = await saveCurrentWeekAsPlan(userId, name, description);
        return NextResponse.json({ id: planId, name, description });
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        );
      }
    },
    mealPlansRateLimiter
  );
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(
    req,
    async (req: NextRequest): Promise<NextResponse> => {
      try {
        const { userId } = getAuth(req);
        if (!userId) {
          throw new AuthorizationError();
        }

        const body = (await req.json()) as unknown;
        const { mealPlanId } = body as {
          mealPlanId?: unknown;
        };

        if (!mealPlanId || typeof mealPlanId !== "number") {
          throw new ValidationError(
            "mealPlanId is required and must be a number"
          );
        }

        await loadMealPlanToCurrentWeek(userId, mealPlanId);
        return NextResponse.json({ success: true });
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        );
      }
    },
    mealPlansRateLimiter
  );
}
