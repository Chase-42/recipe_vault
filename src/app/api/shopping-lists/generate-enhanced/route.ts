import type { NextRequest } from "next/server";
import { withApiHandler } from "~/lib/api-handler";
import { validateRequestParams } from "~/lib/middleware/validate-request";
import { generateEnhancedShoppingListFromWeek } from "~/server/queries/shopping-list";
import { apiSuccess } from "~/lib/api-response";
import { weekStartQuerySchema } from "~/lib/schemas/meal-planner";

const generateEnhancedRateLimiter = {
  maxRequests: 15,
  windowMs: 60 * 1000,
  path: "/api/shopping-lists/generate-enhanced",
};

export const GET = withApiHandler(generateEnhancedRateLimiter, async (req, userId) => {
  const { weekStart } = await validateRequestParams(req, weekStartQuerySchema);
  const result = await generateEnhancedShoppingListFromWeek(userId, new Date(weekStart));
  return apiSuccess(result);
});
