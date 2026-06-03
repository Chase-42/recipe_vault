import type { NextRequest } from "next/server";
import { withApiHandler } from "~/lib/api-handler";
import { validateRequestBody } from "~/lib/middleware/validate-request";
import {
  saveCurrentWeekAsPlan,
  loadMealPlanToCurrentWeek,
  getUserMealPlans,
} from "~/server/queries/meal-planner";
import { apiSuccess } from "~/lib/api-response";
import {
  saveMealPlanSchema,
  loadMealPlanSchema,
} from "~/lib/schemas/meal-planner";

const mealPlansRateLimiter = {
  maxRequests: 30,
  windowMs: 60 * 1000,
  path: "/api/meal-planner/plans",
};

export const GET = withApiHandler(mealPlansRateLimiter, async (_req, userId) => {
  const plans = await getUserMealPlans(userId);
  return apiSuccess(plans);
});

export const POST = withApiHandler(mealPlansRateLimiter, async (req, userId) => {
  const { name, description, weekStart } = await validateRequestBody(req, saveMealPlanSchema);
  const weekStartDate = weekStart ? new Date(weekStart) : undefined;
  const planId = await saveCurrentWeekAsPlan(userId, name, description, weekStartDate);
  return apiSuccess({ id: planId, name, description }, 201);
});

export const PUT = withApiHandler(mealPlansRateLimiter, async (req, userId) => {
  const { mealPlanId } = await validateRequestBody(req, loadMealPlanSchema);
  await loadMealPlanToCurrentWeek(userId, mealPlanId);
  return apiSuccess({ mealPlanId });
});
