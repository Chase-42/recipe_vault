import EditPageClient from "./EditPageClient";
import { getServerUserId } from "~/lib/auth-helpers";
import { ValidationError } from "~/lib/errors";
import { getRecipe } from "~/server/queries";
import type { Recipe } from "~/types";

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getServerUserId();
  const { id } = await params;
  const idAsNumber = Number.parseInt(id, 10);

  if (Number.isNaN(idAsNumber)) {
    throw new ValidationError("Invalid recipe id");
  }

  let initialRecipe: Recipe | null = null;
  try {
    initialRecipe = await getRecipe(idAsNumber, userId);
  } catch {
    initialRecipe = null;
  }

  return (
    <EditPageClient recipeId={idAsNumber} initialRecipe={initialRecipe} />
  );
}