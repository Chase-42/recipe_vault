import { getServerUserId } from "~/lib/auth-helpers";
import EditRecipeForm from "~/app/_components/EditRecipeForm";
import { ValidationError } from "~/lib/errors";
import { getRecipe } from "~/server/queries";
import type { Recipe } from "~/types";
import EditPageClient from "./EditPageClient";

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getServerUserId();

  const { id } = await params;
  const idAsNumber = Number(id);
  if (Number.isNaN(idAsNumber)) throw new ValidationError("Invalid recipe id");

  const recipe: Recipe | null = await getRecipe(idAsNumber, userId);

  if (!recipe) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-xl">Recipe not found.</div>
      </div>
    );
  }

  return <EditPageClient recipe={recipe} />;
}
