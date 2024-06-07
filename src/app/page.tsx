import { SignedIn, SignedOut } from "@clerk/nextjs";
import { getMyRecipes } from "~/server/queries";
export const dynamic = "force-dynamic";

const Recipes = async () => {
	const recipes = await getMyRecipes();
	return (
		<div className="flex flex-wrap">
			{recipes.map((recipe) => (
				<div key={recipe.id} className="w-1/2 p-2">
					{recipe.name}
					<img src={recipe.imageUrl} alt="" />
					{recipe.instructions}
				</div>
			))}
		</div>
	);
};

export default async function HomePage() {
	return (
		<main className="">
			<SignedOut>
				<div className="h-full w-full text-2xl text-center">
					Please sign in to view recipes
				</div>
			</SignedOut>
			<SignedIn>
				<Recipes />
			</SignedIn>
		</main>
	);
}
