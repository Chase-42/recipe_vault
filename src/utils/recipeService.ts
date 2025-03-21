import { schemas, type Recipe, type PaginatedRecipes, type UpdatedRecipe } from "~/lib/schemas"

export const fetchRecipes = (offset = 0, limit = 12): Promise<PaginatedRecipes> => 
	fetch(`/api/recipes?offset=${offset}&limit=${limit}`)
		.then(res => {
			if (!res.ok) throw new Error("Failed to fetch recipes")
			return res.json()
		})
		.then(data => {
			try {
				return schemas.paginatedRecipes.parse(data)
			} catch (error) {
				console.error('Validation error:', error)
				console.error('Received data:', data)
				throw error
			}
		})

export const fetchRecipe = (id: number): Promise<Recipe> => 
	fetch(`/api/recipes/${id}`)
		.then(res => {
			if (!res.ok) throw new Error("Failed to fetch recipe")
			return res.json()
		})
		.then(data => {
			try {
				return schemas.recipe.parse(data)
			} catch (error) {
				console.error('Validation error:', error)
				console.error('Received data:', data)
				throw error
			}
		})

// Update a recipe by ID
export const updateRecipe = (recipe: UpdatedRecipe & { id: number }): Promise<Recipe> => {
	const { id, ...updateData } = recipe;

	return fetch(`/api/recipes/${id}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(updateData)
	})
		.then(async (res) => {
			if (!res.ok) throw new Error("Failed to update recipe");
			return res.json();
		})
		.then(data => schemas.recipe.parse(data));
}

// Delete a recipe by ID
export const deleteRecipe = (id: number): Promise<void> => 
	fetch(`/api/recipes?id=${id}`, { method: "DELETE" })
		.then(res => {
			if (!res.ok) throw new Error("Failed to delete recipe")
		})

interface FavoriteResponse {
	favorite: boolean;
}

export const toggleFavorite = async (id: number): Promise<boolean> => {
	const response = await fetch(`/api/recipes/${id}/favorite`, {
		method: "PUT",
	});
	
	if (!response.ok) {
		throw new Error("Failed to toggle favorite");
	}

	const data = (await response.json()) as FavoriteResponse;
	return data.favorite;
}
