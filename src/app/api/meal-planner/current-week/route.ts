import type { NextRequest } from "next/server";
import { withApiHandler } from "~/lib/api-handler";
import { validateRequestBody, validateRequestParams } from "~/lib/middleware/validate-request";
import {
  getCurrentWeekMeals,
  addMealToWeek,
  removeMealFromWeek,
  moveMealInWeek,
  hasCurrentWeekBeenAddedToShoppingList,
} from "~/server/queries/meal-planner";
import { apiSuccess } from "~/lib/api-response";
import { addMealToWeekSchema, moveMealInWeekSchema, deleteMealFromWeekSchema, weekStartQuerySchema } from "~/lib/schemas/meal-planner";

const currentWeekRateLimiter = {
  maxRequests: 50,
  windowMs: 60 * 1000,
  path: "/api/meal-planner/current-week",
};

export const GET = withApiHandler(currentWeekRateLimiter, async (req, userId) => {
  const params = await validateRequestParams(req, weekStartQuerySchema);
  const weekStart = new Date(params.weekStart);
  const checkShoppingListStatus = params.checkShoppingListStatus === "true";

  if (checkShoppingListStatus) {
    const hasBeenAdded = await hasCurrentWeekBeenAddedToShoppingList(userId, weekStart);
    return apiSuccess({ hasBeenAddedToShoppingList: hasBeenAdded });
  }

  const meals = await getCurrentWeekMeals(userId, weekStart);
  return apiSuccess(meals);
});

export const POST = withApiHandler(currentWeekRateLimiter, async (req, userId) => {
  const { recipeId, date, mealType } = await validateRequestBody(req, addMealToWeekSchema);
  const meal = await addMealToWeek(userId, recipeId, date, mealType);
  return apiSuccess(meal, 201);
});

export const PUT = withApiHandler(currentWeekRateLimiter, async (req, userId) => {
  const { mealId, newDate, newMealType } = await validateRequestBody(req, moveMealInWeekSchema);
  const meal = await moveMealInWeek(userId, mealId, newDate, newMealType);
  return apiSuccess(meal);
});

export const DELETE = withApiHandler(currentWeekRateLimiter, async (req, userId) => {
  const { date, mealType } = await validateRequestParams(req, deleteMealFromWeekSchema);
  await removeMealFromWeek(userId, date, mealType);
  return apiSuccess({ date, mealType }, 200);
});
