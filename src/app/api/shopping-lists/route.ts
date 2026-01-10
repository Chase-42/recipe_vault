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
  addShoppingItems,
  deleteShoppingItem,
  getShoppingItems,
} from "~/server/queries/shopping-list";
import type { ShoppingItemRequest, DeleteItemRequest } from "~/types";
import { apiSuccess, apiError } from "~/lib/api-response";

// Create a shared rate limiter instance for the shopping lists endpoint
const shoppingListsRateLimiter = {
  maxRequests: 50,
  windowMs: 60 * 1000,
  path: "/api/shopping-lists",
};

// We no longer need to create shopping lists since we have one list per user
export async function GET(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(
    req,
    async (req: NextRequest): Promise<NextResponse> => {
      getOrSetCorrelationId(req);
      try {
        const userId = await getServerUserIdFromRequest(req);

        const items = await getShoppingItems(userId);
        return apiSuccess(items);
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return apiError(errorMessage, undefined, statusCode);
      }
    },
    shoppingListsRateLimiter
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(
    req,
    async (req: NextRequest): Promise<NextResponse> => {
      getOrSetCorrelationId(req);
      try {
        const userId = await getServerUserIdFromRequest(req);

        const body = (await req.json()) as ShoppingItemRequest;
        if (!body.name || !body.recipeId) {
          throw new ValidationError("Name and recipeId are required");
        }

        const items = await addShoppingItems(userId, [
          { name: body.name, recipeId: body.recipeId, fromMealPlan: false },
        ]);
        return apiSuccess(items, 201);
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return apiError(errorMessage, undefined, statusCode);
      }
    },
    shoppingListsRateLimiter
  );
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(
    req,
    async (req: NextRequest): Promise<NextResponse> => {
      getOrSetCorrelationId(req);
      try {
        const userId = await getServerUserIdFromRequest(req);

        const body = (await req.json()) as DeleteItemRequest;
        if (!body.id) {
          throw new ValidationError("Item ID is required");
        }

        await deleteShoppingItem(userId, body.id);
        return apiSuccess({ id: body.id }, 200);
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return apiError(errorMessage, undefined, statusCode);
      }
    },
    shoppingListsRateLimiter
  );
}
