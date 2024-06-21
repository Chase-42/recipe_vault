import { getRecipe } from "~/server/queries";

export default async function FullPageImageView(props: { id: number }) {
	const recipe = await getRecipe(props.id);
	return (
		<div className="flex h-full w-full min-w-0 bg-green-200">
			<div className="flex-shrink">
				<img
					src={recipe.imageUrl}
					alt="image"
					className="object-contain flex-shrink"
				/>
			</div>

			<div className="w-48 flex flex-col flex-shrink-0">
				<div className="text-xl font-bold">{recipe.name}</div>
			</div>
		</div>
	);
}
