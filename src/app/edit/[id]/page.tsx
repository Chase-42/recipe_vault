import EditRecipeForm from "~/app/_components/EditRecipeForm";
import { getRecipe } from "~/server/queries";
import type { Recipe } from "~/types";

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
    <div className="flex h-full w-full flex-col">
      <div className="border-b p-2 text-center text-lg font-bold">
        Edit Recipe
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <EditRecipeForm initialRecipe={recipe} />
      </div>
    </div>
  );
}
