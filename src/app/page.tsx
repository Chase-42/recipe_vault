import { SignedIn, SignedOut } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import RecipeList from "~/app/_components/RecipeList";
import { getMyRecipes } from "~/server/queries";
import type { Recipe } from "~/types";

export default async function HomePage() {
	const { userId } = auth();
	let recipes: Recipe[] = [];

	if (userId) {
		recipes = await getMyRecipes();
	}
	return (
		<main className="">
			<SignedOut>
				<div className="h-full w-full text-2xl text-center">
					Please sign in to view recipes
				</div>
			</SignedOut>
			<SignedIn>
				<RecipeList initialRecipes={recipes} />
			</SignedIn>
		</main>
	);
}
