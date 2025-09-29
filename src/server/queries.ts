import "server-only";
import { auth } from "@clerk/nextjs/server";
import { and, desc, asc, eq, sql, or, count, ilike } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { AuthorizationError, NotFoundError, RecipeError } from "~/lib/errors";
import type { Category } from "~/types";
import { db } from "./db";
import { recipes } from "./db/schema";
import type { InferSelectModel, SQL } from "drizzle-orm";

type Recipe = InferSelectModel<typeof recipes>;
type SortOption = "newest" | "oldest" | "favorite" | "relevance";

interface RecipeQueryOptions {
  searchQuery?: string;
  category?: Category;
  sortBy?: SortOption;
}

interface PaginationOptions {
  offset: number;
  limit: number;
}

async function getUserIdFromRequest(req: NextRequest): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new AuthorizationError();
  return userId;
}

function serializeRecipe(recipe: Recipe) {
  return {
    ...recipe,
    createdAt: recipe.createdAt.toISOString(),
    categories: recipe.categories,
    tags: recipe.tags,
  };
}

const sortStrategies: Record<SortOption, SQL[]> = {
  newest: [desc(recipes.createdAt)],
  oldest: [asc(recipes.createdAt)],
  favorite: [desc(recipes.favorite), desc(recipes.createdAt)],
  relevance: [desc(recipes.createdAt)],
};

function getRelevanceSort(searchQuery: string): SQL[] {
  const searchTerm = searchQuery.toLowerCase();
  const relevanceScore = sql<number>`
    CASE 
      WHEN LOWER(${recipes.name}) LIKE ${`%${searchTerm}%`} THEN 3
      WHEN LOWER(${recipes.categories}::text) LIKE ${`%${searchTerm}%`} THEN 2
      WHEN LOWER(${recipes.tags}::text) LIKE ${`%${searchTerm}%`} THEN 1
      ELSE 0
    END
  `;
  return [desc(relevanceScore), desc(recipes.createdAt)];
}

function getSortOrder(sortBy?: SortOption, searchQuery?: string): SQL[] {
  if (searchQuery?.trim()) {
    return getRelevanceSort(searchQuery);
  }
  return sortStrategies[sortBy ?? "newest"];
}

export async function getMyRecipes(
  userId: string,
  { offset, limit }: PaginationOptions,
  options?: RecipeQueryOptions
) {
  const conditions: SQL[] = [eq(recipes.userId, userId)];

  if (options?.searchQuery?.trim()) {
    const searchTerm = `%${options.searchQuery.toLowerCase()}%`;
    const searchCondition = or(
      ilike(recipes.name, searchTerm),
      sql`${recipes.categories}::text ILIKE ${searchTerm}`,
      sql`${recipes.tags}::text ILIKE ${searchTerm}`
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  if (options?.category && options.category !== "All") {
    conditions.push(
      sql`${recipes.categories} @> ${[options.category]}::text[]`
    );
  }

  const whereClause =
    conditions.length === 1 ? conditions[0] : and(...conditions);

  const result = await db
    .select({ total: count() })
    .from(recipes)
    .where(whereClause);

  const total = result[0]?.total ?? 0;

  const paginatedRecipes = await db
    .select()
    .from(recipes)
    .where(whereClause)
    .orderBy(...getSortOrder(options?.sortBy, options?.searchQuery))
    .limit(limit)
    .offset(offset);

  return {
    recipes: paginatedRecipes.map(serializeRecipe),
    total: Number(total),
  };
}

export async function getRecipe(id: number, userId: string) {
  if (!userId) throw new AuthorizationError();

  const recipe = await db
    .select()
    .from(recipes)
    .where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!recipe) {
    throw new NotFoundError("Recipe not found");
  }

  return serializeRecipe(recipe);
}

export async function deleteRecipe(id: number, req: NextRequest) {
  const userId = await getUserIdFromRequest(req);

  const result = await db
    .delete(recipes)
    .where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
    .returning();

  if (result.length === 0) {
    throw new NotFoundError("Recipe not found or unauthorized");
  }

  return { success: true, id };
}

export async function updateRecipe(
  id: number,
  data: Partial<typeof recipes.$inferInsert>,
  req: NextRequest
) {
  const userId = await getUserIdFromRequest(req);
  const { userId: _userId, id: _id, ...updateData } = data;

  const [updatedRecipe] = await db
    .update(recipes)
    .set(updateData)
    .where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
    .returning();

  if (!updatedRecipe) {
    throw new NotFoundError("Recipe not found or unauthorized");
  }

  return serializeRecipe(updatedRecipe);
}

export async function createRecipe(
  data: Omit<typeof recipes.$inferInsert, "userId">,
  req: NextRequest
) {
  const userId = await getUserIdFromRequest(req);

  const result = await db
    .insert(recipes)
    .values({ ...data, userId })
    .returning();

  const newRecipe = result[0];
  if (!newRecipe) {
    throw new RecipeError("Failed to create recipe - no data returned");
  }

  return serializeRecipe(newRecipe);
}

export async function toggleFavorite(id: number, req: NextRequest) {
  const userId = await getUserIdFromRequest(req);

  const recipe = await db
    .select({ favorite: recipes.favorite })
    .from(recipes)
    .where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!recipe) {
    throw new NotFoundError("Recipe not found");
  }

  const result = await db
    .update(recipes)
    .set({ favorite: !recipe.favorite })
    .where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
    .returning();

  const updatedRecipe = result[0];
  if (!updatedRecipe) {
    throw new RecipeError("Failed to update recipe - no data returned");
  }

  return serializeRecipe(updatedRecipe);
}

export async function getUserRecipeStats(userId: string) {
  const stats = await db
    .select({
      total: count(),
      favorites: count(sql`CASE WHEN ${recipes.favorite} THEN 1 END`),
    })
    .from(recipes)
    .where(eq(recipes.userId, userId))
    .then((rows) => rows[0]);

  return {
    total: Number(stats?.total ?? 0),
    favorites: Number(stats?.favorites ?? 0),
  };
}
