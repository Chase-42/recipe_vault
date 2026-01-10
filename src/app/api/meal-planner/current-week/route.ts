import { getServerUserIdFromRequest } from "~/lib/auth-helpers";
import { type NextRequest, NextResponse } from "next/server";
import {
  AuthorizationError,
  handleApiError,
  ValidationError,
} from "~/lib/errors";
import { withRateLimit } from "~/lib/rateLimit";
import { getOrSetCorrelationId } from "~/lib/request-context";
import { validateRequestBody, validateRequestParams } from "~/lib/middleware/validate-request";
import {
  getCurrentWeekMeals,
  addMealToWeek,
  removeMealFromWeek,
  moveMealInWeek,
  hasCurrentWeekBeenAddedToShoppingList,
} from "~/server/queries/meal-planner";
import { apiSuccess, apiError } from "~/lib/api-response";
import { addMealToWeekSchema, moveMealInWeekSchema, deleteMealFromWeekSchema, weekStartQuerySchema } from "~/lib/schemas/meal-planner";

// Create a shared rate limiter instance for the current week endpoint
const currentWeekRateLimiter = {
  maxRequests: 50,
  windowMs: 60 * 1000,
  path: "/api/meal-planner/current-week",
};

export async function GET(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(
    req,
    async (req: NextRequest): Promise<NextResponse> => {
      getOrSetCorrelationId(req);
      try {
        const userId = await getServerUserIdFromRequest(req);
        const params = await validateRequestParams(req, weekStartQuerySchema);
        const weekStart = new Date(params.weekStart);
        const checkShoppingListStatus = params.checkShoppingListStatus === "true";

        if (checkShoppingListStatus) {
          const hasBeenAdded = await hasCurrentWeekBeenAddedToShoppingList(
            userId,
            weekStart
          );
          return apiSuccess({
            hasBeenAddedToShoppingList: hasBeenAdded,
          });
        }

        const meals = await getCurrentWeekMeals(userId, weekStart);
        return apiSuccess(meals);
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return apiError(errorMessage, undefined, statusCode);
      }
    },
    currentWeekRateLimiter
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(
    req,
    async (req: NextRequest): Promise<NextResponse> => {
      getOrSetCorrelationId(req);
      try {
        const userId = await getServerUserIdFromRequest(req);
        const { recipeId, date, mealType } = await validateRequestBody(req, addMealToWeekSchema);

        const meal = await addMealToWeek(
          userId,
          recipeId,
          date,
          mealType
        );
        return apiSuccess(meal, 201);
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return apiError(errorMessage, undefined, statusCode);
      }
    },
    currentWeekRateLimiter
  );
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(
    req,
    async (req: NextRequest): Promise<NextResponse> => {
      getOrSetCorrelationId(req);
      try {
        const userId = await getServerUserIdFromRequest(req);
        const { mealId, newDate, newMealType } = await validateRequestBody(req, moveMealInWeekSchema);

        const meal = await moveMealInWeek(
          userId,
          mealId,
          newDate,
          newMealType
        );
        return apiSuccess(meal);
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return apiError(errorMessage, undefined, statusCode);
      }
    },
    currentWeekRateLimiter
  );
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(
    req,
    async (req: NextRequest): Promise<NextResponse> => {
      getOrSetCorrelationId(req);
      try {
        const userId = await getServerUserIdFromRequest(req);
        const { date, mealType } = await validateRequestParams(req, deleteMealFromWeekSchema);

        await removeMealFromWeek(
          userId,
          date,
          mealType
        );
        return apiSuccess({ date, mealType }, 200);
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return apiError(errorMessage, undefined, statusCode);
      }
    },
    currentWeekRateLimiter
  );
}
