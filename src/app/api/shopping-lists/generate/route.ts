import { getServerUserIdFromRequest } from "~/lib/auth-helpers";
import { type NextRequest, NextResponse } from "next/server";
import {
  AuthorizationError,
  handleApiError,
  ValidationError,
} from "~/lib/errors";
import { withRateLimit } from "~/lib/rateLimit";
import {
  generateShoppingListFromWeek,
  addMealPlanItemsToShoppingList,
  clearMealPlanItemsFromShoppingList,
} from "~/server/queries/shopping-list";
import { markCurrentWeekAsAddedToShoppingList } from "~/server/queries/meal-planner";

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
      try {
        const userId = await getServerUserIdFromRequest(req);

        const body = await req.json();
        const { weekStart, addToList = false, clearExisting = false } = body;

        if (!weekStart) {
          throw new ValidationError("weekStart is required");
        }

        const weekStartDate = new Date(weekStart);
        if (isNaN(weekStartDate.getTime())) {
          throw new ValidationError("Invalid weekStart date");
        }

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

        return NextResponse.json({
          ingredients,
          addedToList: addToList,
          clearedExisting: clearExisting,
        });
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        );
      }
    },
    generateRateLimiter
  );
}

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

        // Generate shopping list from current week meals (preview only)
        const ingredients = await generateShoppingListFromWeek(
          userId,
          weekStartDate
        );

        return NextResponse.json({ ingredients });
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        );
      }
    },
    generateRateLimiter
  );
}
