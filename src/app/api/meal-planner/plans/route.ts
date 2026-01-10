import { getServerUserIdFromRequest } from "~/lib/auth-helpers";
import { type NextRequest, NextResponse } from "next/server";
import {
  AuthorizationError,
  handleApiError,
  ValidationError,
} from "~/lib/errors";
import { withRateLimit } from "~/lib/rateLimit";
import { getOrSetCorrelationId } from "~/lib/request-context";
import {
  saveCurrentWeekAsPlan,
  loadMealPlanToCurrentWeek,
  getUserMealPlans,
} from "~/server/queries/meal-planner";
import { apiSuccess, apiError } from "~/lib/api-response";

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
      getOrSetCorrelationId(req);
      try {
        const userId = await getServerUserIdFromRequest(req);

        const plans = await getUserMealPlans(userId);
        return apiSuccess(plans);
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return apiError(errorMessage, undefined, statusCode);
      }
    },
    mealPlansRateLimiter
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(
    req,
    async (req: NextRequest): Promise<NextResponse> => {
      getOrSetCorrelationId(req);
      try {
        const userId = await getServerUserIdFromRequest(req);

        const body = (await req.json()) as unknown;
        const { name, description } = body as {
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
        return apiSuccess({ id: planId, name, description }, 201);
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return apiError(errorMessage, undefined, statusCode);
      }
    },
    mealPlansRateLimiter
  );
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(
    req,
    async (req: NextRequest): Promise<NextResponse> => {
      getOrSetCorrelationId(req);
      try {
        const userId = await getServerUserIdFromRequest(req);

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
        return apiSuccess({ mealPlanId });
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return apiError(errorMessage, undefined, statusCode);
      }
    },
    mealPlansRateLimiter
  );
}
