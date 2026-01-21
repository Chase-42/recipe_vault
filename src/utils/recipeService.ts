import { schemas } from "~/lib/schemas";
import { RecipeError } from "~/lib/errors";
import { ERROR_MESSAGES } from "~/lib/errorHandler";
import type {
  Recipe,
  PaginatedRecipes,
  UpdatedRecipe,
  CreateRecipeInput,
  FetchRecipesParams,
} from "~/types";
import {
  parsePaginatedApiResponse,
  parseApiResponse,
} from "~/utils/api-client";

function throwOnError(response: Response): void {
  if (!response.ok) {
    throw new RecipeError(
      response.status === 404 ? ERROR_MESSAGES.NOT_FOUND : ERROR_MESSAGES.SERVER_ERROR,
      response.status
    );
  }
}

function validateRecipe(data: unknown): Recipe {
  const result = schemas.recipe.safeParse(data);
  if (!result.success) {
    throw new RecipeError("Invalid data received from server", 500);
  }
  return result.data;
}

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

  const response = await fetch(`/api/recipes?${params.toString()}`);
  throwOnError(response);

  const { data: recipes, pagination } = await parsePaginatedApiResponse<Recipe>(response);
  return { recipes, pagination };
};

export const fetchRecipe = async (id: number): Promise<Recipe> => {
  const response = await fetch(`/api/recipes/${id}`);
  throwOnError(response);

  const data = await parseApiResponse<Recipe>(response);
  return validateRecipe(data);
};

export const updateRecipe = async (recipe: UpdatedRecipe & { id: number }): Promise<Recipe> => {
  const { id, ...updateData } = recipe;
  const response = await fetch(`/api/recipes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updateData),
  });
  throwOnError(response);

  const data = await parseApiResponse<Recipe>(response);
  return validateRecipe(data);
};

export const deleteRecipe = async (id: number): Promise<void> => {
  const response = await fetch(`/api/recipes?id=${id}`, { method: "DELETE" });
  throwOnError(response);
};

export const toggleFavorite = async (id: number): Promise<boolean> => {
  const response = await fetch(`/api/recipes/${id}/favorite`, { method: "PUT" });
  throwOnError(response);

  const data = await parseApiResponse<{ favorite: boolean }>(response);
  return data.favorite;
};

export const createRecipe = async (recipe: CreateRecipeInput): Promise<Recipe> => {
  const response = await fetch("/api/recipes/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(recipe),
  });
  throwOnError(response);

  const data = await parseApiResponse<Recipe>(response);
  return validateRecipe(data);
};
