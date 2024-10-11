import type { Recipe } from "~/types";

// Fetch single recipe by ID
export const fetchRecipe = async (id: number): Promise<Recipe> => {
  const response = await fetch(`/api/recipes/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch recipe");
  }
  return (await response.json()) as Recipe;
};

// Fetch all recipes for a user
export const fetchRecipes = async ({
  pageParam = 0,
}): Promise<{ recipes: Recipe[]; nextCursor: number }> => {
  const response = await fetch(`/api/recipes?cursor=${pageParam}`);
  if (!response.ok) {
    throw new Error("Failed to fetch recipes");
  }
  const data = (await response.json()) as {
    recipes: Recipe[];
    nextCursor: number;
  };
  console.log("fetchRecipes", data);
  return data;
};

// Update a recipe by ID
export const updateRecipe = async (recipe: Recipe): Promise<void> => {
  const response = await fetch(`/api/recipes/${recipe.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(recipe),
  });

  if (!response.ok) {
    throw new Error("Failed to update recipe");
  }
};

// Delete a recipe by ID
export const deleteRecipe = async (id: number) => {
  const response = await fetch(`/api/recipes?id=${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete recipe");
  }
};

