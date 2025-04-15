import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { getShoppingItems, addShoppingItems, deleteShoppingItem } from "~/server/queries/shopping-list";
import { withRateLimit } from "~/lib/rateLimit";

interface ShoppingItemRequest {
  name: string;
  recipeId: number;
}

interface DeleteItemRequest {
  id: number;
}

// Create a shared rate limiter instance for the shopping lists endpoint
const shoppingListsRateLimiter = { maxRequests: 50, windowMs: 60 * 1000, path: "/api/shopping-lists" };

// We no longer need to create shopping lists since we have one list per user
export async function GET(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(req, async (req: NextRequest): Promise<NextResponse> => {
    try {
      const { userId } = getAuth(req);
      if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
      }

      const items = await getShoppingItems(userId);
      return NextResponse.json(items);
    } catch (error) {
      console.error("Error fetching shopping items:", error);
      return new NextResponse("Internal Server Error", { status: 500 });
    }
  }, shoppingListsRateLimiter);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(req, async (req: NextRequest): Promise<NextResponse> => {
    try {
      const { userId } = getAuth(req);
      if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
      }

      const body = await req.json() as ShoppingItemRequest;
      if (!body.name || !body.recipeId) {
        return new NextResponse("Name and recipeId are required", { status: 400 });
      }

      const items = await addShoppingItems(userId, [{ name: body.name, recipeId: body.recipeId }]);
      return NextResponse.json(items);
    } catch (error) {
      console.error("Error adding shopping item:", error);
      return new NextResponse("Internal Server Error", { status: 500 });
    }
  }, shoppingListsRateLimiter);
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(req, async (req: NextRequest): Promise<NextResponse> => {
    try {
      const { userId } = getAuth(req);
      if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
      }

      const body = await req.json() as DeleteItemRequest;
      if (!body.id) {
        return new NextResponse("Item ID is required", { status: 400 });
      }

      await deleteShoppingItem(userId, body.id);
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      console.error("Error deleting shopping item:", error);
      return new NextResponse("Internal Server Error", { status: 500 });
    }
  }, shoppingListsRateLimiter);
} 