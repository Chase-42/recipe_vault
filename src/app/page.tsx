import { SignedIn, SignedOut } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { getMyRecipes } from "~/server/queries";
export const dynamic = "force-dynamic";

const Recipes = async () => {
	const recipes = await getMyRecipes();
	return (
		<div className="flex flex-wrap justify-center gap-4 p-4">
			{[...recipes, ...recipes].map((recipe) => (
				<div key={recipe.id} className="flex h-auto w-auto flex-col">
					{recipe.name}
					<Link href={`/img/${recipe.id}`}>
						<Image
							src={recipe.imageUrl}
							style={{ objectFit: "contain" }}
							width={192}
							height={192}
							alt={recipe.name}
						/>
					</Link>
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
