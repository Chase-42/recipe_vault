import { getRecipe } from "~/server/queries";

export default async function FullPageImageView(props: { id: number }) {
	const recipe = await getRecipe(props.id);
	return (
		<div className="flex h-full w-full">
			<div className="w-1/2 flex flex-col flex-shrink-0 border-r p-4">
				<div className="border-b text-center text-lg p-2">{recipe.name}</div>
				<div className="border-b text-center text-sm p-2">
					{recipe.instructions}
				</div>
				<div className="border-b text-center text-sm p-2"> {recipe.link}</div>
			</div>
			<div className="w-1/2 flex justify-center items-center">
				<img
					src={recipe.imageUrl}
					alt="image"
					className="object-contain w-full h-full p-4"
				/>
			</div>
		</div>
	);
}
