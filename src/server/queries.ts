import "server-only";
import { db } from "./db";
import { auth } from "@clerk/nextjs/server";
import { recipes } from "./db/schema";
import { and, eq, desc, sql } from "drizzle-orm";
import type { UpdatedRecipe } from "~/types";

// Fetch user's recipes with pagination and total count
export async function getMyRecipes(
	userId: string,
	offset: number,
	limit: number,
) {
	try {
		// Get total count
		const [countResult] = await db
			.select({ count: sql<number>`count(*)` })
			.from(recipes)
			.where(eq(recipes.userId, userId))
			.execute();

		const total = Number(countResult?.count ?? 0);

		// Get paginated recipes
		const paginatedRecipes = await db
			.select({
				id: recipes.id,
				name: recipes.name,
				ingredients: recipes.ingredients,
				instructions: recipes.instructions,
				imageUrl: recipes.imageUrl,
				blurDataUrl: recipes.blurDataUrl,
				favorite: recipes.favorite,
				createdAt: recipes.createdAt,
			})
			.from(recipes)
			.where(eq(recipes.userId, userId))
			.offset(offset)
			.limit(limit)
			.orderBy(desc(recipes.createdAt));

		return {
			recipes: paginatedRecipes,
			total,
		};
	} catch (error) {
		console.error("Failed to fetch recipes:", error);
		throw new Error("Failed to fetch recipes");
	}
}

// Rest of the file remains the same...
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

export async function updateRecipe(recipe: UpdatedRecipe & { id: number }) {
	const { userId } = auth();

	if (!userId) throw new Error("Unauthorized");

	try {
		await db
			.update(recipes)
			.set({
				name: recipe.name,
				instructions: recipe.instructions,
				ingredients: recipe.ingredients,
				favorite: recipe.favorite,
				imageUrl: recipe.imageUrl,
			})
			.where(and(eq(recipes.id, recipe.id), eq(recipes.userId, userId)));
	} catch (error) {
		console.error("Failed to update recipe:", error);
		throw new Error("Failed to update recipe");
	}
}
