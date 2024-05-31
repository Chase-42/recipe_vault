import { db } from "~/server/db";
export const dynamic = "force-dynamic";

export default async function HomePage() {
	const recipes = await db.query.recipes.findMany({
		orderBy: (model, { desc }) => desc(model.id),
	});
	console.log(recipes);

	return (
		<main className="">
			<div className="flex flex-wrap">
				{recipes.map((recipe) => (
					<div key={recipe.id} className="w-1/2 p-2">
						{recipe.instructions}
						<img src={recipe.imageUrl} alt="" />
					</div>
				))}
			</div>
		</main>
	);
}
