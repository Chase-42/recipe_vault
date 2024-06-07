import "server-only";
import { db } from "./db";
import { auth } from "@clerk/nextjs/server";

export const getMyRecipes = async () => {
	const user = auth();

	if (!user.userId) throw new Error("Unauthorized");

	const recipes = await db.query.recipes.findMany({
		where: (model, { eq }) => eq(model.userId, user.userId),
		orderBy: (model, { desc }) => desc(model.id),
	});
	return recipes;
};
