import { schemas } from "~/lib/schemas";
import { RecipeError } from "~/lib/errors";
import type {
  Recipe,
  PaginatedRecipes,
  UpdatedRecipe,
  CreateRecipeInput,
  FetchRecipesParams,
  FavoriteResponse,
} from "~/types";

export const fetchRecipes = async ({
  offset = 0,
  limit = 12,
  searchTerm,
  category,
  sortOption,
}: FetchRecipesParams = {}): Promise<PaginatedRecipes> => {
  const params = new URLSearchParams({
    offset: offset.toString(),
    limit: limit.toString(),
  });

  if (searchTerm) params.append("search", searchTerm);
  if (category) params.append("category", category);
  if (sortOption) params.append("sort", sortOption);

  const url = `/api/recipes?${params.toString()}`;
  const timeLabel = `fetchRecipes: ${url} ${Date.now()}`;
  console.time(timeLabel);
  try {
    const response = await fetch(url);
    if (!response.ok) throw new RecipeError("Failed to fetch recipes", 500);
    const data = await response.json();
    const parsedData = schemas.paginatedRecipes.parse(data);
    return parsedData;
  } catch (error) {
    console.error("fetchRecipes error:", error);
    throw error;
  } finally {
    console.timeEnd(timeLabel);
  }
};

export const fetchRecipe = async (id: number): Promise<Recipe> => {
  const url = `/api/recipes/${id}`;
  const timeLabel = `fetchRecipe: ${url} ${Date.now()}`;
  console.time(timeLabel);
  try {
    const response = await fetch(url);
    if (!response.ok) throw new RecipeError("Failed to fetch recipe", 500);
    const data = await response.json();
    return schemas.recipe.parse(data);
  } catch (error) {
    console.error("Validation error:", error);
    throw error;
  } finally {
    console.timeEnd(timeLabel);
  }
};

// Update a recipe by ID
export const updateRecipe = async (
  recipe: UpdatedRecipe & { id: number }
): Promise<Recipe> => {
  const { id, ...updateData } = recipe;
  const url = `/api/recipes/${id}`;
  const timeLabel = `updateRecipe: ${url} ${Date.now()}`;
  console.time(timeLabel);
  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData),
    });
    if (!response.ok) throw new RecipeError("Failed to update recipe", 500);
    const data = await response.json();
    return schemas.recipe.parse(data);
  } finally {
    console.timeEnd(timeLabel);
  }
};

// Delete a recipe by ID
export const deleteRecipe = async (id: number): Promise<void> => {
  const url = `/api/recipes?id=${id}`;
  const timeLabel = `deleteRecipe: ${url} ${Date.now()}`;
  console.time(timeLabel);
  try {
    const response = await fetch(url, { method: "DELETE" });
    if (!response.ok) throw new RecipeError("Failed to delete recipe", 500);
  } finally {
    console.timeEnd(timeLabel);
  }
};

export const toggleFavorite = async (id: number): Promise<boolean> => {
  const url = `/api/recipes/${id}/favorite`;
  const timeLabel = `toggleFavorite: ${url} ${Date.now()}`;
  console.time(timeLabel);
  try {
    const response = await fetch(url, {
      method: "PUT",
    });

    if (!response.ok) {
      throw new RecipeError("Failed to toggle favorite", 500);
    }

    const data = await response.json();
    const validatedData = schemas.favoriteResponse.parse(data);
    return validatedData.favorite;
  } finally {
    console.timeEnd(timeLabel);
  }
};

export const createRecipe = async (
  recipe: CreateRecipeInput
): Promise<Recipe> => {
  const url = "/api/recipes/create";
  const timeLabel = `createRecipe: ${url} ${Date.now()}`;
  console.time(timeLabel);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(recipe),
    });

    const data = await response.json();
    const validatedData = schemas.apiResponse(schemas.recipe).parse(data);

    if (!response.ok || validatedData.error) {
      throw new RecipeError(
        validatedData.error ?? "Failed to create recipe",
        500
      );
    }

    if (!validatedData.data) {
      throw new RecipeError("No data received from server", 500);
    }

    return validatedData.data;
  } finally {
    console.timeEnd(timeLabel);
  }
};
