import { SignedIn, SignedOut } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import RecipeList from "~/components/RecipeList";
import { getMyRecipes } from "~/server/queries";

export default async function HomePage() {
	const recipes = await getMyRecipes();
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
