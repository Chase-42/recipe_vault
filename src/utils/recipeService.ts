import { schemas, type Recipe, type PaginatedRecipes } from "~/lib/schemas"
import type { z } from "zod";

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
export const updateRecipe = (recipe: Recipe): Promise<void> => {
	const { id, name, link, imageUrl, ingredients, instructions, favorite } = recipe
	const updateData = { name, link, imageUrl, ingredients, instructions, favorite }

	return fetch(`/api/recipes/${id}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(updateData)
	})
		.then(res => {
			if (!res.ok) throw new Error("Failed to update recipe")
		})
}

// Delete a recipe by ID
export const deleteRecipe = (id: number): Promise<void> => 
	fetch(`/api/recipes?id=${id}`, { method: "DELETE" })
		.then(res => {
			if (!res.ok) throw new Error("Failed to delete recipe")
		})

export const toggleFavorite = async (id: number): Promise<void> => {
	const recipe = await fetchRecipe(id)
	await updateRecipe({ ...recipe, favorite: !recipe.favorite })
}
