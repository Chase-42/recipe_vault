import { getRecipe } from "~/server/queries";

export default async function FullPageImageView(props: { id: number }) {
	const recipe = await getRecipe(props.id);
	return (
		<div className="flex h-full w-full min-w-">
			<div className="flex-shrink flex justify-center items-center">
				<img
					src={recipe.imageUrl}
					alt="image"
					className="object-contain flex-shrink"
				/>
			</div>

			<div className="w-48 flex flex-col flex-shrink-0 border-l">
				<div className="text-xl font-bold">{recipe.name}</div>
				<div className="text-sm">{recipe.instructions}</div>
				<div className="text-sm"> {recipe.link}</div>
			</div>
		</div>
	);
}
