import type { NextRequest } from "next/server";
import { RecipeError } from "~/lib/errors";
import { revalidatePath } from "next/cache";
import { validateCreateRecipe } from "~/lib/validation";
import type { CreateRecipeInput, Recipe } from "~/types";
import { withApiHandler } from "~/lib/api-handler";
import { db } from "~/server/db";
import { recipes } from "~/server/db/schema";
import { dynamicBlurDataUrl } from "~/utils/dynamicBlurDataUrl";
import { apiSuccess } from "~/lib/api-response";

const createRecipeRateLimiter = {
  maxRequests: 10,
  windowMs: 60 * 1000,
  path: "/api/recipes/create",
};

export const POST = withApiHandler(createRecipeRateLimiter, async (req, userId) => {
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

  revalidatePath("/");

  return apiSuccess(
    { ...recipe, createdAt: recipe.createdAt.toISOString() } as Recipe,
    201
  );
});
