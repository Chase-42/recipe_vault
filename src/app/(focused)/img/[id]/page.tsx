import FullImagePageClient from "~/app/_components/FullImagePageClient";
import { getServerUserId } from "~/lib/auth-helpers";
import { getRecipe } from "~/server/queries";
import type { Recipe } from "~/types";

export default async function ImagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getServerUserId();
  const { id } = await params;
  const idAsNumber = Number.parseInt(id, 10);

  let initialRecipe: Recipe | null = null;
  try {
    initialRecipe = await getRecipe(idAsNumber, userId);
  } catch {
    initialRecipe = null;
  }

  return (
    <FullImagePageClient recipeId={idAsNumber} initialRecipe={initialRecipe} />
  );
}