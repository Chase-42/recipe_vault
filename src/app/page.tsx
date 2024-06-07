import { SignedIn, SignedOut } from "@clerk/nextjs";
import Image from "next/image";
import { getMyRecipes } from "~/server/queries";
export const dynamic = "force-dynamic";

const Recipes = async () => {
	const recipes = await getMyRecipes();
	return (
		<div className="flex flex-wrap justify-center gap-4">
			{recipes.map((recipe) => (
				<div key={recipe.id} className="flex h-48 w-48 flex-col">
					{recipe.name}
					<Image
						src={recipe.imageUrl}
						style={{ objectFit: "contain" }}
						width={192}
						height={192}
						alt={recipe.name}
					/>
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
