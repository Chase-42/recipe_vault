import { getRecipe } from "~/server/queries";
import type { Recipe } from "~/types";
import Image from "next/image";

interface FullPageImageViewProps {
	id: number;
}

export default async function FullPageImageView({
	id,
}: FullPageImageViewProps) {
	const recipe: Recipe | null = await getRecipe(id);

	if (!recipe) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<div className="text-xl">Recipe not found.</div>
			</div>
		);
	}

	// Splitting ingredients and instructions by new lines for proper formatting
	const ingredients = recipe.ingredients.split("\n");
	const instructions = recipe.instructions.split("\n");

	return (
		<div className="flex h-full w-full">
			<div className="w-1/2 flex flex-col border-r p-4">
				<div className="border-b text-center text-lg p-2 font-bold">
					{recipe.name}
				</div>
				<div className="border-b p-4">
					<h3 className="text-base font-semibold mb-2">Ingredients:</h3>
					<ul className="list-disc list-inside space-y-1">
						{ingredients.map((ingredient, index) => (
							<li key={`${ingredient}-${index}`}>{ingredient}</li>
						))}
					</ul>
				</div>
				<div className="border-b p-4">
					<h3 className="text-base font-semibold mb-2">Instructions:</h3>
					<ol className="list-decimal list-inside space-y-1">
						{instructions.map((instruction, index) => (
							<li key={`${instruction}-${index}`}>{instruction}</li>
						))}
					</ol>
				</div>
				<div className="p-4">
					<a
						href={recipe.link}
						target="_blank"
						rel="noopener noreferrer"
						className="text-blue-500 hover:underline"
					>
						{recipe.link}
					</a>
				</div>
			</div>
			<div className="w-1/2 flex justify-center items-center relative size-full">
				<Image
					src={recipe.imageUrl}
					alt={`Image of ${recipe.name}`}
					className="object-contain w-full h-full p-4"
					fill
					priority
				/>
			</div>
		</div>
	);
}
