import { getServerUserIdFromRequest } from "~/lib/auth-helpers";
import { type NextRequest, NextResponse } from "next/server";
import { AuthorizationError, handleApiError, RecipeError } from "~/lib/errors";
import { validateCreateRecipe } from "~/lib/validation";
import type { CreateRecipeInput } from "~/types";
import { withRateLimit } from "~/lib/rateLimit";
import { db } from "~/server/db";
import { recipes } from "~/server/db/schema";
import type { Recipe } from "~/types";
import { dynamicBlurDataUrl } from "~/utils/dynamicBlurDataUrl";

// Rate limiter for recipe creation
const createRecipeRateLimiter = {
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
  path: "/api/recipes/create",
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(
    req,
    async (req: NextRequest): Promise<NextResponse> => {
      try {
        const userId = await getServerUserIdFromRequest(req);

        const body: unknown = await req.json();
        const validatedData = validateCreateRecipe(body as CreateRecipeInput);

        const blurDataUrl = await dynamicBlurDataUrl(validatedData.imageUrl);

        const [recipe] = await db
          .insert(recipes)
          .values({
            link: validatedData.link,
            name: validatedData.name,
            imageUrl: validatedData.imageUrl,
            blurDataUrl,
            instructions: validatedData.instructions,
            ingredients: validatedData.ingredients,
            favorite: validatedData.favorite,
            categories: validatedData.categories,
            tags: validatedData.tags,
            userId,
          })
          .returning();

        if (!recipe) {
          throw new RecipeError("Failed to create recipe", 500);
        }

        return NextResponse.json({
          data: {
            ...recipe,
            createdAt: recipe.createdAt.toISOString(),
          } as Recipe,
        });
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        );
      }
    },
    createRecipeRateLimiter
  );
}
