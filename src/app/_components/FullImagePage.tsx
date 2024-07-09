// src/app/_components/FullImagePage.tsx
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
    <div className="flex h-full w-full flex-col md:flex-row">
      <div className="flex flex-col border-b p-4 md:w-1/2 md:border-b-0 md:border-r">
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
      <div className="relative flex w-full items-center justify-center p-4 md:w-1/2">
        <div className="relative h-96 w-full md:h-full">
          <Image
            src={recipe.imageUrl}
            alt={`Image of ${recipe.name}`}
            className="object-contain"
            placeholder="blur"
            blurDataURL={recipe.blurDataUrl}
            fill
            priority
          />
        </div>
      </div>
    </div>
  );
}
