import type { NextRequest } from "next/server";
import { withApiHandler } from "~/lib/api-handler";
import { validateRequestBody, validateRequestParams } from "~/lib/middleware/validate-request";
import {
  generateShoppingListFromWeek,
  addMealPlanItemsToShoppingList,
  clearMealPlanItemsFromShoppingList,
} from "~/server/queries/shopping-list";
import { markCurrentWeekAsAddedToShoppingList } from "~/server/queries/meal-planner";
import { apiSuccess } from "~/lib/api-response";
import { generateShoppingListSchema, weekStartQuerySchema } from "~/lib/schemas/meal-planner";

const generateRateLimiter = {
  maxRequests: 20,
  windowMs: 60 * 1000,
  path: "/api/shopping-lists/generate",
};

export const POST = withApiHandler(generateRateLimiter, async (req, userId) => {
  const { weekStart, addToList, clearExisting } = await validateRequestBody(req, generateShoppingListSchema);
  const weekStartDate = new Date(weekStart);
  const ingredients = await generateShoppingListFromWeek(userId, weekStartDate);

  if (addToList) {
    if (clearExisting) {
      await clearMealPlanItemsFromShoppingList(userId);
    }
    await addMealPlanItemsToShoppingList(userId, ingredients);
    await markCurrentWeekAsAddedToShoppingList(userId, weekStartDate);
  }

  return apiSuccess({ ingredients, addedToList: addToList, clearedExisting: clearExisting });
});

export const GET = withApiHandler(generateRateLimiter, async (req, userId) => {
  const { weekStart } = await validateRequestParams(req, weekStartQuerySchema);
  const ingredients = await generateShoppingListFromWeek(userId, new Date(weekStart));
  return apiSuccess({ ingredients });
});
