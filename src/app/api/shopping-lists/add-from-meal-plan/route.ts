import { getServerUserIdFromRequest } from "~/lib/auth-helpers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  AuthorizationError,
  handleApiError,
  ValidationError,
} from "~/lib/errors";
import { withRateLimit } from "~/lib/rateLimit";
import { getOrSetCorrelationId } from "~/lib/request-context";
import { addProcessedIngredientsToShoppingList } from "~/server/queries/shopping-list";

// Validation schemas
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

type AddFromMealPlanRequest = z.infer<typeof addFromMealPlanSchema>;

// Create a shared rate limiter instance for the add-from-meal-plan endpoint
const addFromMealPlanRateLimiter = {
  maxRequests: 20,
  windowMs: 60 * 1000,
  path: "/api/shopping-lists/add-from-meal-plan",
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(
    req,
    async (req: NextRequest): Promise<NextResponse> => {
      getOrSetCorrelationId(req);
      try {
        const userId = await getServerUserIdFromRequest(req);

        const body = (await req.json()) as AddFromMealPlanRequest;
        const { ingredients } = addFromMealPlanSchema.parse(body);

        // Filter only selected ingredients
        const selectedIngredients = ingredients.filter(
          (ingredient) => ingredient.isSelected
        );

        if (selectedIngredients.length === 0) {
          return NextResponse.json(
            { success: true, addedItems: [], updatedItems: [] },
            { status: 200 }
          );
        }

        const result = await addProcessedIngredientsToShoppingList(
          userId,
          selectedIngredients
        );

        return NextResponse.json({
          success: true,
          addedItems: result.addedItems,
          updatedItems: result.updatedItems,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ValidationError(
            `Invalid request data: ${error.errors
              .map((e) => `${e.path.join(".")}: ${e.message}`)
              .join(", ")}`
          );
        }
        const { error: errorMessage, statusCode } = handleApiError(error);
        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        );
      }
    },
    addFromMealPlanRateLimiter
  );
}
