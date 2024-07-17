import "server-only";
import { db } from "./db";
import { auth } from "@clerk/nextjs/server";
import { recipes } from "./db/schema";
import { and, eq, desc } from "drizzle-orm";
import type { UpdatedRecipe } from "~/types";

// Fetch user's recipes with pagination
export async function getMyRecipes(
	userId: string,
	cursor: number,
	limit: number,
) {
	try {
		return await db
			.select({
				id: recipes.id,
				name: recipes.name,
				ingredients: recipes.ingredients,
				instructions: recipes.instructions,
				imageUrl: recipes.imageUrl,
				blurDataUrl: recipes.blurDataUrl,
			})
			.from(recipes)
			.where(eq(recipes.userId, userId))
			.offset(cursor)
			.limit(limit)
			.orderBy(desc(recipes.createdAt));
	} catch (error) {
		console.error("Failed to fetch recipes:", error);
		throw new Error("Failed to fetch recipes");
	}
}

// Fetch a single recipe by ID
export const getRecipe = async (id: number) => {
	const { userId } = auth();

	if (!userId) throw new Error("Unauthorized");

	const recipe = await db.query.recipes.findFirst({
		where: (model) => eq(model.id, id),
	});

	if (!recipe) throw new Error("Recipe not found");
	if (recipe.userId !== userId) throw new Error("Unauthorized");

	return recipe;
};

// Delete a recipe by ID
export async function deleteRecipe(id: number) {
	const { userId } = auth();

	if (!userId) throw new Error("Unauthorized");

	try {
		await db
			.delete(recipes)
			.where(and(eq(recipes.id, id), eq(recipes.userId, userId)));
	} catch (error) {
		console.error("Failed to delete recipe:", error);
		throw new Error("Failed to delete recipe");
	}
}

// Update a recipe by ID
export async function updateRecipe(id: number, recipe: UpdatedRecipe) {
	const { userId } = auth();

	if (!userId) throw new Error("Unauthorized");

	try {
		await db
			.update(recipes)
			.set({
				name: recipe.name,
				instructions: recipe.instructions,
				ingredients: recipe.ingredients,
			})
			.where(and(eq(recipes.id, id), eq(recipes.userId, userId)));
	} catch (error) {
		console.error("Failed to update recipe:", error);
		throw new Error("Failed to update recipe");
	}
}
