import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import {
  AuthorizationError,
  handleApiError,
  ValidationError,
} from "~/lib/errors";
import { withRateLimit } from "~/lib/rateLimit";
import {
  getCurrentWeekMeals,
  addMealToWeek,
  removeMealFromWeek,
  moveMealInWeek,
  hasCurrentWeekBeenAddedToShoppingList,
} from "~/server/queries/meal-planner";

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
      try {
        const { userId } = await auth();
        if (!userId) {
          throw new AuthorizationError();
        }

        const { searchParams } = new URL(req.url);
        const weekStartParam = searchParams.get("weekStart");
        const checkShoppingListStatus =
          searchParams.get("checkShoppingListStatus") === "true";

        if (!weekStartParam) {
          throw new ValidationError("weekStart parameter is required");
        }

        const weekStart = new Date(weekStartParam);
        if (Number.isNaN(weekStart.getTime())) {
          throw new ValidationError("Invalid weekStart date format");
        }

        if (checkShoppingListStatus) {
          const hasBeenAdded = await hasCurrentWeekBeenAddedToShoppingList(
            userId,
            weekStart
          );
          return NextResponse.json({
            hasBeenAddedToShoppingList: hasBeenAdded,
          });
        }

        const meals = await getCurrentWeekMeals(userId, weekStart);
        return NextResponse.json(meals);
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        );
      }
    },
    currentWeekRateLimiter
  );
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

        const body = (await req.json()) as unknown;
        const { recipeId, date, mealType } = body as {
          recipeId?: unknown;
          date?: unknown;
          mealType?: unknown;
        };

        if (!recipeId || !date || !mealType) {
          throw new ValidationError(
            "recipeId, date, and mealType are required"
          );
        }

        if (typeof recipeId !== "number") {
          throw new ValidationError("recipeId must be a number");
        }

        if (typeof date !== "string") {
          throw new ValidationError("date must be a string");
        }

        if (
          typeof mealType !== "string" ||
          !["breakfast", "lunch", "dinner"].includes(mealType)
        ) {
          throw new ValidationError(
            "mealType must be breakfast, lunch, or dinner"
          );
        }

        const dateObj = new Date(date);
        if (Number.isNaN(dateObj.getTime())) {
          throw new ValidationError("Invalid date format");
        }

        const meal = await addMealToWeek(
          userId,
          recipeId,
          date,
          mealType as "breakfast" | "lunch" | "dinner"
        );
        return NextResponse.json(meal);
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        );
      }
    },
    currentWeekRateLimiter
  );
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(
    req,
    async (req: NextRequest): Promise<NextResponse> => {
      try {
        const { userId } = await auth();
        if (!userId) {
          throw new AuthorizationError();
        }

        const body = (await req.json()) as unknown;
        const { mealId, newDate, newMealType } = body as {
          mealId?: unknown;
          newDate?: unknown;
          newMealType?: unknown;
        };

        if (!mealId || !newDate || !newMealType) {
          throw new ValidationError(
            "mealId, newDate, and newMealType are required"
          );
        }

        if (typeof mealId !== "number") {
          throw new ValidationError("mealId must be a number");
        }

        if (typeof newDate !== "string") {
          throw new ValidationError("newDate must be a string");
        }

        if (
          typeof newMealType !== "string" ||
          !["breakfast", "lunch", "dinner"].includes(newMealType)
        ) {
          throw new ValidationError(
            "newMealType must be breakfast, lunch, or dinner"
          );
        }

        const dateObj = new Date(newDate);
        if (Number.isNaN(dateObj.getTime())) {
          throw new ValidationError("Invalid newDate format");
        }

        const meal = await moveMealInWeek(
          userId,
          mealId,
          newDate,
          newMealType as "breakfast" | "lunch" | "dinner"
        );
        return NextResponse.json(meal);
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        );
      }
    },
    currentWeekRateLimiter
  );
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(
    req,
    async (req: NextRequest): Promise<NextResponse> => {
      try {
        const { userId } = await auth();
        if (!userId) {
          throw new AuthorizationError();
        }

        const { searchParams } = new URL(req.url);
        const date = searchParams.get("date");
        const mealType = searchParams.get("mealType");

        if (!date || !mealType) {
          throw new ValidationError(
            "date and mealType parameters are required"
          );
        }

        if (!["breakfast", "lunch", "dinner"].includes(mealType)) {
          throw new ValidationError(
            "mealType must be breakfast, lunch, or dinner"
          );
        }

        const dateObj = new Date(date);
        if (Number.isNaN(dateObj.getTime())) {
          throw new ValidationError("Invalid date format");
        }

        await removeMealFromWeek(
          userId,
          date,
          mealType as "breakfast" | "lunch" | "dinner"
        );
        return new NextResponse(null, { status: 204 });
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        );
      }
    },
    currentWeekRateLimiter
  );
}
