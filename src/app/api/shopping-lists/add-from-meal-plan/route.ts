import type { NextRequest } from "next/server";
import { z } from "zod";
import { withApiHandler } from "~/lib/api-handler";
import { validateRequestBody } from "~/lib/middleware/validate-request";
import { addProcessedIngredientsToShoppingList } from "~/server/queries/shopping-list";
import { apiSuccess } from "~/lib/api-response";

const duplicateActionSchema = z.enum(["skip", "combine", "add_separate"]);

const processedIngredientSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number().optional(),
  originalText: z.string(),
  isSelected: z.boolean(),
  editedQuantity: z.number().optional(),
  duplicateMatches: z.array(
    z.object({
      existingItemId: z.number(),
      existingItemName: z.string(),
      matchConfidence: z.enum(["high", "medium", "low"]),
      suggestedAction: duplicateActionSchema,
    })
  ),
  sourceRecipes: z.array(
    z.object({
      recipeId: z.number(),
      recipeName: z.string(),
    })
  ),
});

const addFromMealPlanSchema = z.object({
  ingredients: z.array(processedIngredientSchema),
});

const addFromMealPlanRateLimiter = {
  maxRequests: 20,
  windowMs: 60 * 1000,
  path: "/api/shopping-lists/add-from-meal-plan",
};

export const POST = withApiHandler(addFromMealPlanRateLimiter, async (req, userId) => {
  const { ingredients } = await validateRequestBody(req, addFromMealPlanSchema);
  const selectedIngredients = ingredients.filter((i) => i.isSelected);

  if (selectedIngredients.length === 0) {
    return apiSuccess({ addedItems: [], updatedItems: [] });
  }

  const result = await addProcessedIngredientsToShoppingList(userId, selectedIngredients);
  return apiSuccess({ addedItems: result.addedItems, updatedItems: result.updatedItems });
});
