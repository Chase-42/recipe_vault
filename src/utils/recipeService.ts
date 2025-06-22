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

export const fetchRecipes = ({
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

  return fetch(`/api/recipes?${params.toString()}`)
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch recipes");
      return res.json();
    })
    .then((data) => {
      try {
        return schemas.paginatedRecipes.parse(data);
      } catch (error) {
        console.error("Validation error:", error);
        console.error("Received data:", data);
        throw error;
      }
    });
};

export const fetchRecipe = (id: number): Promise<Recipe> =>
  fetch(`/api/recipes/${id}`)
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch recipe");
      return res.json();
    })
    .then((data) => {
      try {
        return schemas.recipe.parse(data);
      } catch (error) {
        console.error("Validation error:", error);
        console.error("Received data:", data);
        throw error;
      }
    });

// Update a recipe by ID
export const updateRecipe = (
  recipe: UpdatedRecipe & { id: number }
): Promise<Recipe> => {
  const { id, ...updateData } = recipe;

  return fetch(`/api/recipes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updateData),
  })
    .then(async (res) => {
      if (!res.ok) throw new Error("Failed to update recipe");
      return res.json();
    })
    .then((data) => schemas.recipe.parse(data));
};

// Delete a recipe by ID
export const deleteRecipe = (id: number): Promise<void> =>
  fetch(`/api/recipes?id=${id}`, { method: "DELETE" }).then((res) => {
    if (!res.ok) throw new Error("Failed to delete recipe");
  });

export const toggleFavorite = async (id: number): Promise<boolean> => {
  const response = await fetch(`/api/recipes/${id}/favorite`, {
    method: "PUT",
  });

  if (!response.ok) {
    throw new Error("Failed to toggle favorite");
  }

  const data = await response.json();
  const validatedData = schemas.favoriteResponse.parse(data);
  return validatedData.favorite;
};

export const createRecipe = async (
  recipe: CreateRecipeInput
): Promise<Recipe> => {
  const response = await fetch("/api/recipes/create", {
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
};
