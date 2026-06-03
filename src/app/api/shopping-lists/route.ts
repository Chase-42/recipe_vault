import type { NextRequest } from "next/server";
import { ValidationError } from "~/lib/errors";
import { withApiHandler } from "~/lib/api-handler";
import {
  addShoppingItems,
  deleteShoppingItem,
  getShoppingItems,
} from "~/server/queries/shopping-list";
import type { ShoppingItemRequest, DeleteItemRequest } from "~/types";
import { apiSuccess } from "~/lib/api-response";

const shoppingListsRateLimiter = {
  maxRequests: 50,
  windowMs: 60 * 1000,
  path: "/api/shopping-lists",
};

export const GET = withApiHandler(shoppingListsRateLimiter, async (_req, userId) => {
  const items = await getShoppingItems(userId);
  return apiSuccess(items);
});

export const POST = withApiHandler(shoppingListsRateLimiter, async (req, userId) => {
  const body = (await req.json()) as ShoppingItemRequest;
  if (!body.name || !body.recipeId) {
    throw new ValidationError("Name and recipeId are required");
  }
  const items = await addShoppingItems(userId, [
    { name: body.name, recipeId: body.recipeId, fromMealPlan: false },
  ]);
  return apiSuccess(items, 201);
});

export const DELETE = withApiHandler(shoppingListsRateLimiter, async (req, userId) => {
  const body = (await req.json()) as DeleteItemRequest;
  if (!body.id) {
    throw new ValidationError("Item ID is required");
  }
  await deleteShoppingItem(userId, body.id);
  return apiSuccess({ id: body.id }, 200);
});
