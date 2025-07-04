import "server-only";
import { getAuth } from "@clerk/nextjs/server";
import { and, desc, eq, sql, or, count, ilike } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { AuthorizationError, NotFoundError, RecipeError } from "../lib/errors";
import type { Category } from "~/types";
import { MAIN_MEAL_CATEGORIES } from "~/types";
import { db } from "./db";
import { recipes } from "./db/schema";
import type { InferSelectModel } from "drizzle-orm";

type Recipe = InferSelectModel<typeof recipes>;

// Fetch user's recipes with pagination and total count
export async function getMyRecipes(
  userId: string,
  offset: number,
  limit: number,
  options?: {
    searchQuery?: string;
    category?: Category;
    sortBy?: "newest" | "oldest" | "favorite" | "relevance";
  }
) {
  const timeLabel = `getMyRecipes ${JSON.stringify(options)} ${Date.now()}`;
  try {
    console.time(timeLabel);
    // Build base conditions
    const conditions = [eq(recipes.userId, userId)];

    if (options?.searchQuery) {
      const searchTerm = `%${options.searchQuery}%`;
      const searchCondition = or(
        ilike(recipes.name, searchTerm),
        ilike(recipes.ingredients, searchTerm),
        ilike(recipes.instructions, searchTerm),
        sql`${recipes.categories}::text ILIKE ${searchTerm}`,
        sql`${recipes.tags}::text ILIKE ${searchTerm}`
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    if (options?.category && options.category !== "all") {
      conditions.push(
        sql`${recipes.categories} @> ARRAY[${options.category}]::text[]`
      );
    }

    // Get total count
    const countResult = await db
      .select({ count: count() })
      .from(recipes)
      .where(and(...conditions));

    const total = Number(countResult[0]?.count ?? 0);

    // Build query based on sort option
    let paginatedRecipes: Recipe[];

    if (options?.sortBy === "favorite") {
      paginatedRecipes = await db
        .select({
          id: recipes.id,
          userId: recipes.userId,
          name: recipes.name,
          link: recipes.link,
          ingredients: recipes.ingredients,
          instructions: recipes.instructions,
          imageUrl: recipes.imageUrl,
          blurDataUrl: recipes.blurDataUrl,
          favorite: recipes.favorite,
          createdAt: recipes.createdAt,
          categories: recipes.categories,
          tags: recipes.tags,
        })
        .from(recipes)
        .where(and(...conditions))
        .orderBy(desc(recipes.favorite), desc(recipes.createdAt))
        .offset(offset)
        .limit(limit);
    } else if (options?.sortBy === "oldest") {
      paginatedRecipes = await db
        .select({
          id: recipes.id,
          userId: recipes.userId,
          name: recipes.name,
          link: recipes.link,
          ingredients: recipes.ingredients,
          instructions: recipes.instructions,
          imageUrl: recipes.imageUrl,
          blurDataUrl: recipes.blurDataUrl,
          favorite: recipes.favorite,
          createdAt: recipes.createdAt,
          categories: recipes.categories,
          tags: recipes.tags,
        })
        .from(recipes)
        .where(and(...conditions))
        .orderBy(recipes.createdAt)
        .offset(offset)
        .limit(limit);
    } else if (options?.sortBy === "relevance" && options?.searchQuery) {
      const similarityExpr = sql`similarity(${recipes.name}, ${options.searchQuery}) + 
          similarity(${recipes.instructions}, ${options.searchQuery}) + 
          similarity(${recipes.ingredients}, ${options.searchQuery}) +
          similarity(${recipes.categories}::text, ${options.searchQuery}) +
          similarity(${recipes.tags}::text, ${options.searchQuery})`;
      paginatedRecipes = await db
        .select({
          id: recipes.id,
          userId: recipes.userId,
          name: recipes.name,
          link: recipes.link,
          ingredients: recipes.ingredients,
          instructions: recipes.instructions,
          imageUrl: recipes.imageUrl,
          blurDataUrl: recipes.blurDataUrl,
          favorite: recipes.favorite,
          createdAt: recipes.createdAt,
          categories: recipes.categories,
          tags: recipes.tags,
        })
        .from(recipes)
        .where(and(...conditions))
        .orderBy(desc(similarityExpr))
        .offset(offset)
        .limit(limit);
    } else {
      // Default: newest
      paginatedRecipes = await db
        .select({
          id: recipes.id,
          userId: recipes.userId,
          name: recipes.name,
          link: recipes.link,
          ingredients: recipes.ingredients,
          instructions: recipes.instructions,
          imageUrl: recipes.imageUrl,
          blurDataUrl: recipes.blurDataUrl,
          favorite: recipes.favorite,
          createdAt: recipes.createdAt,
          categories: recipes.categories,
          tags: recipes.tags,
        })
        .from(recipes)
        .where(and(...conditions))
        .orderBy(desc(recipes.createdAt))
        .offset(offset)
        .limit(limit);
    }

    const result = {
      recipes: paginatedRecipes.map((recipe) => ({
        ...recipe,
        createdAt: recipe.createdAt.toISOString(),
        categories: recipe.categories,
        tags: recipe.tags,
      })),
      total,
    };
    console.timeEnd(timeLabel);
    return result;
  } catch (error) {
    console.error("Failed to fetch recipes:", error);
    throw new RecipeError("Failed to fetch recipes", 500);
  }
}

export const getRecipe = async (id: number, userId: string) => {
  const timeLabel = `getRecipe ${id} ${Date.now()}`;
  console.time(timeLabel);
  if (!userId) throw new AuthorizationError();

  const recipe = await db
    .select()
    .from(recipes)
    .where(eq(recipes.id, id))
    .limit(1)
    .then((rows) => rows[0]);

  if (!recipe) throw new NotFoundError("Recipe not found");
  if (recipe.userId !== userId) throw new AuthorizationError();

  const result = {
    ...recipe,
    link: recipe.link,
    createdAt: recipe.createdAt.toISOString(),
    categories: recipe.categories,
    tags: recipe.tags,
  };
  console.timeEnd(timeLabel);
  return result;
};

export async function deleteRecipe(id: number, req: NextRequest) {
  const timeLabel = `deleteRecipe ${id} ${Date.now()}`;
  console.time(timeLabel);
  const { userId } = getAuth(req);

  if (!userId) throw new AuthorizationError();

  try {
    await db
      .delete(recipes)
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId)));
    console.timeEnd(timeLabel);
  } catch (error) {
    console.error("Failed to delete recipe:", error);
    throw new RecipeError("Failed to delete recipe", 500);
  }
}

export async function updateRecipe(
  id: number,
  data: Partial<typeof recipes.$inferInsert>,
  req: NextRequest
) {
  const timeLabel = `updateRecipe ${id} ${Date.now()}`;
  console.time(timeLabel);
  const { userId } = getAuth(req);

  if (!userId) throw new AuthorizationError();

  try {
    const [updatedRecipe] = await db
      .update(recipes)
      .set(data)
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
      .returning();

    if (!updatedRecipe) {
      throw new NotFoundError("Recipe not found or unauthorized");
    }

    const result = {
      ...updatedRecipe,
      createdAt: updatedRecipe.createdAt.toISOString(),
      categories: updatedRecipe.categories,
      tags: updatedRecipe.tags,
    };
    console.timeEnd(timeLabel);
    return result;
  } catch (error) {
    console.error("Failed to update recipe:", error);
    throw new RecipeError("Failed to update recipe", 500);
  }
}
