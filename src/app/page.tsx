import { SignedIn, SignedOut } from "@clerk/nextjs";
import { db } from "~/server/db";
export const dynamic = "force-dynamic";

export default async function HomePage() {
	const Images = async () => {
		const recipes = await db.query.recipes.findMany({
			orderBy: (model, { desc }) => desc(model.id),
		});
		return (
			<div className="flex flex-wrap">
				{recipes.map((recipe) => (
					<div key={recipe.id} className="w-1/2 p-2">
						{recipe.instructions}
						<img src={recipe.imageUrl} alt="" />
					</div>
				))}
			</div>
		);
	};

	return (
		<main className="">
			<SignedOut>
				<div className="h-full w-full text-2xl text-center">
					Please sign in to view recipes
				</div>
			</SignedOut>
			<SignedIn>
				<Images />
			</SignedIn>
		</main>
	);
}
