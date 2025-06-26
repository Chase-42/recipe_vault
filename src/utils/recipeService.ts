import {
  type PaginatedRecipes,
  type Recipe,
  type UpdatedRecipe,
  schemas,
} from "~/lib/schemas";
import type { FavoriteResponse } from "~/types/api";
import type { APIResponse } from "~/types/api";
import type { CreateRecipeInput } from "~/types/recipe";
import type { FetchRecipesParams } from "~/types";

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
  console.time(`fetchRecipes: ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch recipes");
    const data = await response.json();
    const parsedData = schemas.paginatedRecipes.parse(data);
    return parsedData;
  } catch (error) {
    console.error("fetchRecipes error:", error);
    throw error;
  } finally {
    console.timeEnd(`fetchRecipes: ${url}`);
  }
};

export const fetchRecipe = async (id: number): Promise<Recipe> => {
  const url = `/api/recipes/${id}`;
  console.time(`fetchRecipe: ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch recipe");
    const data = await response.json();
    return schemas.recipe.parse(data);
  } catch (error) {
    console.error("Validation error:", error);
    throw error;
  } finally {
    console.timeEnd(`fetchRecipe: ${url}`);
  }
};

// Update a recipe by ID
export const updateRecipe = async (
  recipe: UpdatedRecipe & { id: number }
): Promise<Recipe> => {
  const { id, ...updateData } = recipe;
  const url = `/api/recipes/${id}`;
  console.time(`updateRecipe: ${url}`);
  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData),
    });
    if (!response.ok) throw new Error("Failed to update recipe");
    const data = await response.json();
    return schemas.recipe.parse(data);
  } finally {
    console.timeEnd(`updateRecipe: ${url}`);
  }
};

// Delete a recipe by ID
export const deleteRecipe = async (id: number): Promise<void> => {
  const url = `/api/recipes?id=${id}`;
  console.time(`deleteRecipe: ${url}`);
  try {
    const response = await fetch(url, { method: "DELETE" });
    if (!response.ok) throw new Error("Failed to delete recipe");
  } finally {
    console.timeEnd(`deleteRecipe: ${url}`);
  }
};

export const toggleFavorite = async (id: number): Promise<boolean> => {
  const url = `/api/recipes/${id}/favorite`;
  console.time(`toggleFavorite: ${url}`);
  try {
    const response = await fetch(url, {
      method: "PUT",
    });

    if (!response.ok) {
      throw new Error("Failed to toggle favorite");
    }

    const data = await response.json();
    const validatedData = schemas.favoriteResponse.parse(data);
    return validatedData.favorite;
  } finally {
    console.timeEnd(`toggleFavorite: ${url}`);
  }
};

export const createRecipe = async (
  recipe: CreateRecipeInput
): Promise<Recipe> => {
  const url = "/api/recipes/create";
  console.time(`createRecipe: ${url}`);
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
      throw new Error(validatedData.error ?? "Failed to create recipe");
    }

    if (!validatedData.data) {
      throw new Error("No data received from server");
    }

    return validatedData.data;
  } finally {
    console.timeEnd(`createRecipe: ${url}`);
  }
};
