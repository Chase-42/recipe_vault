import "server-only";
import { db } from "./db";
import { auth } from "@clerk/nextjs/server";
import { recipes } from "./db/schema";
import { and, eq } from "drizzle-orm";
import type { UpdatedRecipe } from "~/types";

export const getMyRecipes = async () => {
	const user = auth();

	if (!user.userId) throw new Error("Unauthorized");

	const recipes = await db.query.recipes.findMany({
		where: (model, { eq }) => eq(model.userId, user.userId),
		orderBy: (model, { desc }) => desc(model.id),
	});
	return recipes;
};

export const getRecipe = async (id: number) => {
	const user = auth();

	if (!user.userId) throw new Error("Unauthorized");

	const recipe = await db.query.recipes.findFirst({
		where: (model, { eq }) => eq(model.id, id),
	});

	if (!recipe) throw new Error("Recipe not found");
	if (recipe.userId !== user.userId) throw new Error("Unauthorized");

	return recipe;
};

export async function deleteRecipe(id: number) {
	const user = auth();
	if (!user.userId) throw new Error("Unauthorized");

	await db
		.delete(recipes)
		.where(and(eq(recipes.id, id), eq(recipes.userId, user.userId)));
}

export async function updateRecipe(id: number, recipe: UpdatedRecipe) {
	const user = auth();
	if (!user.userId) throw new Error("Unauthorized");

	await db
		.update(recipes)
		.set({
			name: recipe.name,
			instructions: recipe.instructions,
			ingredients: recipe.ingredients,
		})
		.where(eq(recipes.id, id));
}
