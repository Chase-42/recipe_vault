import type { Recipe } from "~/types";

interface PaginatedResponse {
	recipes: Recipe[];
	total: number;
}

export const fetchRecipes = async (
	offset = 0,
	limit = 12,
): Promise<PaginatedResponse> => {
	const response = await fetch(`/api/recipes?offset=${offset}&limit=${limit}`);
	if (!response.ok) {
		throw new Error("Failed to fetch recipes");
	}
	return response.json() as Promise<PaginatedResponse>;
};

export const fetchRecipe = async (id: number): Promise<Recipe> => {
	const response = await fetch(`/api/recipes/${id}`);
	if (!response.ok) {
		throw new Error("Failed to fetch recipe");
	}
	return response.json() as Promise<Recipe>;
};
// Update a recipe by ID
export const updateRecipe = async (recipe: Recipe): Promise<void> => {
	// Only send fields that can be updated
	const { id, name, link, imageUrl, ingredients, instructions, favorite } =
		recipe;

	const updateData = {
		name,
		link,
		imageUrl,
		ingredients,
		instructions,
		favorite,
	};

	const response = await fetch(`/api/recipes/${id}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(updateData),
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
