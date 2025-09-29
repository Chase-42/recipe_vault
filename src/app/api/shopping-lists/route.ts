import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import {
  AuthorizationError,
  handleApiError,
  ValidationError,
} from "~/lib/errors";
import { withRateLimit } from "~/lib/rateLimit";
import {
  addShoppingItems,
  deleteShoppingItem,
  getShoppingItems,
} from "~/server/queries/shopping-list";
import type { ShoppingItemRequest, DeleteItemRequest } from "~/types";

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
      try {
        const { userId } = await auth();
        if (!userId) {
          throw new AuthorizationError();
        }

        const items = await getShoppingItems(userId);
        return NextResponse.json(items);
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        );
      }
    },
    shoppingListsRateLimiter
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

        const body = (await req.json()) as ShoppingItemRequest;
        if (!body.name || !body.recipeId) {
          throw new ValidationError("Name and recipeId are required");
        }

        const items = await addShoppingItems(userId, [
          { name: body.name, recipeId: body.recipeId, fromMealPlan: false },
        ]);
        return NextResponse.json(items);
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        );
      }
    },
    shoppingListsRateLimiter
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

        const body = (await req.json()) as DeleteItemRequest;
        if (!body.id) {
          throw new ValidationError("Item ID is required");
        }

        await deleteShoppingItem(userId, body.id);
        return new NextResponse(null, { status: 204 });
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        );
      }
    },
    shoppingListsRateLimiter
  );
}
