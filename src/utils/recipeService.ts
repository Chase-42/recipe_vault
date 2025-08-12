import { schemas } from "~/lib/schemas";
import { RecipeError } from "~/lib/errors";
import { handleError, ERROR_MESSAGES } from "~/lib/errorHandler";
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
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new RecipeError(
        response.status === 404
          ? ERROR_MESSAGES.NOT_FOUND
          : ERROR_MESSAGES.SERVER_ERROR,
        response.status
      );
    }
    const data = await response.json();
    return schemas.paginatedRecipes.parse(data);
  } catch (error) {
    handleError(error, "fetchRecipes", { showToast: false });
    throw error;
  }
};

export const fetchRecipe = async (id: number): Promise<Recipe> => {
  const url = `/api/recipes/${id}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new RecipeError(
        response.status === 404
          ? ERROR_MESSAGES.NOT_FOUND
          : ERROR_MESSAGES.SERVER_ERROR,
        response.status
      );
    }
    const data = await response.json();
    return schemas.recipe.parse(data);
  } catch (error) {
    handleError(error, "fetchRecipe", { showToast: false });
    throw error;
  }
};

// Update a recipe by ID
export const updateRecipe = async (
  recipe: UpdatedRecipe & { id: number }
): Promise<Recipe> => {
  const { id, ...updateData } = recipe;
  const url = `/api/recipes/${id}`;
  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData),
    });
    if (!response.ok) {
      throw new RecipeError(
        response.status === 404
          ? ERROR_MESSAGES.NOT_FOUND
          : ERROR_MESSAGES.SERVER_ERROR,
        response.status
      );
    }
    const data = await response.json();
    return schemas.recipe.parse(data);
  } catch (error) {
    handleError(error, "updateRecipe", { showToast: false });
    throw error;
  }
};

// Delete a recipe by ID
export const deleteRecipe = async (id: number): Promise<void> => {
  const url = `/api/recipes?id=${id}`;
  try {
    const response = await fetch(url, { method: "DELETE" });
    if (!response.ok) {
      throw new RecipeError(
        response.status === 404
          ? ERROR_MESSAGES.NOT_FOUND
          : ERROR_MESSAGES.SERVER_ERROR,
        response.status
      );
    }
  } catch (error) {
    handleError(error, "deleteRecipe", { showToast: false });
    throw error;
  }
};

export const toggleFavorite = async (id: number): Promise<boolean> => {
  const url = `/api/recipes/${id}/favorite`;
  try {
    const response = await fetch(url, {
      method: "PUT",
    });

    if (!response.ok) {
      throw new RecipeError(
        response.status === 404
          ? ERROR_MESSAGES.NOT_FOUND
          : ERROR_MESSAGES.SERVER_ERROR,
        response.status
      );
    }

    const data = await response.json();
    const validatedData = schemas.favoriteResponse.parse(data);
    return validatedData.favorite;
  } catch (error) {
    handleError(error, "toggleFavorite", { showToast: false });
    throw error;
  }
};

export const createRecipe = async (
  recipe: CreateRecipeInput
): Promise<Recipe> => {
  const url = "/api/recipes/create";
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
        validatedData.error ?? ERROR_MESSAGES.SERVER_ERROR,
        response.status
      );
    }

    if (!validatedData.data) {
      throw new RecipeError("No data received from server", 500);
    }

    return validatedData.data;
  } catch (error) {
    handleError(error, "createRecipe", { showToast: false });
    throw error;
  }
};
