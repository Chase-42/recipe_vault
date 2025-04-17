import "server-only";
import { db } from "./db";
import { auth } from "@clerk/nextjs/server";
import { recipes } from "./db/schema";
import { and, eq, desc, sql } from "drizzle-orm";
import { MAIN_MEAL_CATEGORIES } from "../types/category";

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
				userId: recipes.userId,
				name: recipes.name,
				link: recipes.link,
				ingredients: recipes.ingredients,
				instructions: recipes.instructions,
				imageUrl: recipes.imageUrl,
				blurDataUrl: recipes.blurDataUrl,
				favorite: recipes.favorite,
				createdAt: recipes.createdAt,
				categories: recipes.categories,
				tags: recipes.tags,
			})
			.from(recipes)
			.where(eq(recipes.userId, userId))
			.offset(offset)
			.limit(limit)
			.orderBy(desc(recipes.createdAt));

		return {
			recipes: paginatedRecipes.map(recipe => ({
				...recipe,
				createdAt: recipe.createdAt.toISOString(),
				categories: toCategoryOrUndefined(recipe.categories),
				tags: recipe.tags,
			})),
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

	return {
		...recipe,
		link: recipe.link,
		createdAt: recipe.createdAt.toISOString(),
		categories: toCategoryOrUndefined(recipe.categories),
		tags: recipe.tags,
	};
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

export async function updateRecipe(
	id: number,
	data: Partial<typeof recipes.$inferInsert>,
) {
	const { userId } = auth();

	if (!userId) throw new Error("Unauthorized");

	try {
		// Ensure we have valid data to update
		if (!data || Object.keys(data).length === 0) {
			throw new Error("No values to set");
		}

		const result = await db
			.update(recipes)
			.set(data)
			.where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
			.returning();

		if (!result.length) {
			throw new Error("Recipe not found");
		}

		const updatedRecipe = result[0]!;
		return {
			...updatedRecipe,
			categories: toCategoryOrUndefined(updatedRecipe.categories),
			tags: updatedRecipe.tags,
		};
	} catch (error) {
		console.error("Failed to update recipe:", error);
		throw new Error("Failed to update recipe");
	}
}

function toCategoryOrUndefined(val: string | undefined): string {
	return val && MAIN_MEAL_CATEGORIES.includes(val as typeof MAIN_MEAL_CATEGORIES[number]) ? val : "";
}
