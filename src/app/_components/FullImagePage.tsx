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

  const ingredients = recipe.ingredients.split("\n");
  const instructions = recipe.instructions.split("\n");

  return (
    <div className="flex h-full w-full">
      <div className="flex w-1/2 flex-col border-r p-4">
        <div className="border-b p-2 text-center text-lg font-bold">
          {recipe.name}
        </div>
        <div className="border-b p-4">
          <h3 className="mb-2 text-base font-semibold">Ingredients:</h3>
          <ul className="list-inside list-disc space-y-1">
            {ingredients.map((ingredient, index) => (
              <li key={`${ingredient}-${index}`}>{ingredient}</li>
            ))}
          </ul>
        </div>
        <div className="border-b p-4">
          <h3 className="mb-2 text-base font-semibold">Instructions:</h3>
          <ol className="list-inside list-decimal space-y-1">
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
      <div className="relative flex size-full w-1/2 items-center justify-center">
        <Image
          src={recipe.imageUrl}
          alt={`Image of ${recipe.name}`}
          className="h-full w-full object-contain p-4"
          placeholder="blur"
          blurDataURL={recipe.blurDataUrl}
          fill
          priority
        />
      </div>
    </div>
  );
}
