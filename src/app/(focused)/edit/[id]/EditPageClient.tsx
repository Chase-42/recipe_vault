"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import EditRecipeForm from "~/app/_components/EditRecipeForm";
import type { Recipe } from "~/types";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { fetchRecipe } from "~/utils/recipeService";
import { recipeKey } from "~/utils/query-keys";

interface EditPageClientProps {
  recipeId: number;
  initialRecipe?: Recipe | null;
}

export default function EditPageClient({
  recipeId,
  initialRecipe,
}: EditPageClientProps) {
  const queryClient = useQueryClient();
  const cachedData = queryClient.getQueryData<Recipe>(recipeKey(recipeId));
  const hasData = !!(cachedData ?? initialRecipe);

  const { data: recipe, error, isLoading } = useQuery({
    queryKey: recipeKey(recipeId),
    queryFn: () => fetchRecipe(recipeId),
    initialData: cachedData ?? initialRecipe ?? undefined,
    gcTime: 1000 * 60 * 30,
    staleTime: 1000 * 60 * 5,
    refetchOnMount: !hasData,
  });

  const displayRecipe = recipe ?? cachedData ?? initialRecipe;

  if (isLoading && !displayRecipe) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="md" fullHeight={false} />
      </div>
    );
  }

  if (error && !displayRecipe) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-xl">Failed to load recipe.</div>
      </div>
    );
  }

  if (!displayRecipe) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-xl">Recipe not found.</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div className="flex-1 overflow-y-auto p-4">
        <EditRecipeForm initialRecipe={displayRecipe} />
      </div>
    </div>
  );
}
