import EditRecipeForm from "~/app/_components/EditRecipeForm";
import FullPageImageView from "~/app/_components/FullImagePage";
import { getRecipe } from "~/server/queries";
import type { Recipe } from "~/types";
import Image from "next/image";

export default async function EditPage({
  params: { id: recipeId },
}: {
  params: { id: string };
}) {
  const idAsNumber = Number(recipeId);
  if (Number.isNaN(idAsNumber)) throw new Error("Invalid photo id");
  const recipe: Recipe | null = await getRecipe(idAsNumber);

  if (!recipe) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-xl">Recipe not found.</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full w-full flex-col md:flex-row">
        <div className="flex flex-col border-b p-4 md:w-1/2 md:border-b-0 md:border-r">
          <div className="border-b p-2 text-center text-lg font-bold">
            Edit Recipe
          </div>
          <EditRecipeForm initialRecipe={recipe} />
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
    </>
  );
}
