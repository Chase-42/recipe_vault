import { getServerUserIdFromRequest } from "~/lib/auth-helpers";
import type { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "~/lib/errors";
import { withRateLimit } from "~/lib/rateLimit";
import { getOrSetCorrelationId } from "~/lib/request-context";
import { validateRequestBody } from "~/lib/middleware/validate-request";
import {
  saveCurrentWeekAsPlan,
  loadMealPlanToCurrentWeek,
  getUserMealPlans,
} from "~/server/queries/meal-planner";
import { apiSuccess, apiError } from "~/lib/api-response";
import {
  saveMealPlanSchema,
  loadMealPlanSchema,
} from "~/lib/schemas/meal-planner";

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
        const { name, description, weekStart } = await validateRequestBody(
          req,
          saveMealPlanSchema
        );

        const weekStartDate = weekStart ? new Date(weekStart) : undefined;
        const planId = await saveCurrentWeekAsPlan(
          userId,
          name,
          description,
          weekStartDate
        );
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
        const { mealPlanId } = await validateRequestBody(
          req,
          loadMealPlanSchema
        );

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
