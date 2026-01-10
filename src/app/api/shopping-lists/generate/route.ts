import { getServerUserIdFromRequest } from "~/lib/auth-helpers";
import { type NextRequest, NextResponse } from "next/server";
import {
  AuthorizationError,
  handleApiError,
  ValidationError,
} from "~/lib/errors";
import { withRateLimit } from "~/lib/rateLimit";
import { getOrSetCorrelationId } from "~/lib/request-context";
import { validateRequestBody } from "~/lib/middleware/validate-request";
import {
  generateShoppingListFromWeek,
  addMealPlanItemsToShoppingList,
  clearMealPlanItemsFromShoppingList,
} from "~/server/queries/shopping-list";
import { markCurrentWeekAsAddedToShoppingList } from "~/server/queries/meal-planner";
import { apiSuccess, apiError } from "~/lib/api-response";
import { generateShoppingListSchema, weekStartQuerySchema } from "~/lib/schemas/meal-planner";
import { validateRequestParams } from "~/lib/middleware/validate-request";

// Rate limiter for shopping list generation
const generateRateLimiter = {
  maxRequests: 20,
  windowMs: 60 * 1000,
  path: "/api/shopping-lists/generate",
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(
    req,
    async (req: NextRequest): Promise<NextResponse> => {
      getOrSetCorrelationId(req);
      try {
        const userId = await getServerUserIdFromRequest(req);
        const { weekStart, addToList, clearExisting } = await validateRequestBody(req, generateShoppingListSchema);

        const weekStartDate = new Date(weekStart);

        // Generate shopping list from current week meals
        const ingredients = await generateShoppingListFromWeek(
          userId,
          weekStartDate
        );

        // If requested, add to shopping list
        if (addToList) {
          // Clear existing meal plan items if requested
          if (clearExisting) {
            await clearMealPlanItemsFromShoppingList(userId);
          }

          // Add new items to shopping list
          await addMealPlanItemsToShoppingList(userId, ingredients);

          // Mark current week as added to shopping list
          await markCurrentWeekAsAddedToShoppingList(userId, weekStartDate);
        }

        return apiSuccess({
          ingredients,
          addedToList: addToList,
          clearedExisting: clearExisting,
        });
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return apiError(errorMessage, undefined, statusCode);
      }
    },
    generateRateLimiter
  );
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(
    req,
    async (req: NextRequest): Promise<NextResponse> => {
      getOrSetCorrelationId(req);
      try {
        const userId = await getServerUserIdFromRequest(req);
        const { weekStart } = await validateRequestParams(req, weekStartQuerySchema);
        const weekStartDate = new Date(weekStart);

        // Generate shopping list from current week meals (preview only)
        const ingredients = await generateShoppingListFromWeek(
          userId,
          weekStartDate
        );

        return apiSuccess({ ingredients });
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return apiError(errorMessage, undefined, statusCode);
      }
    },
    generateRateLimiter
  );
}
