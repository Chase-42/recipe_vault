"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import EditRecipeForm from "~/app/_components/EditRecipeForm";
import type { Recipe } from "~/types";
import { PageTransition } from "~/components/ui/page-transition";
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
  const hasCachedData = !!cachedData;

  const { data: recipe, error, isLoading } = useQuery({
    queryKey: recipeKey(recipeId),
    queryFn: () => fetchRecipe(recipeId),
    initialData: cachedData ?? initialRecipe ?? undefined,
    placeholderData: cachedData ?? initialRecipe ?? undefined,
    gcTime: 1000 * 60 * 30, // 30 minutes (longer than default for recipe data)
    refetchOnMount: !hasCachedData,
  });

  const displayRecipe = recipe ?? cachedData ?? initialRecipe;

  if (isLoading && !displayRecipe) {
    return (
      <PageTransition>
        <div className="flex min-h-[60vh] items-center justify-center">
          <LoadingSpinner size="md" fullHeight={false} />
        </div>
      </PageTransition>
    );
  }

  if (error && !displayRecipe) {
    return (
      <PageTransition>
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-xl">Failed to load recipe.</div>
        </div>
      </PageTransition>
    );
  }

  if (!displayRecipe) {
    return (
      <PageTransition>
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-xl">Recipe not found.</div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="h-full w-full bg-background">
        <div className="flex-1 overflow-y-auto p-4">
          <EditRecipeForm initialRecipe={displayRecipe} />
        </div>
      </div>
    </PageTransition>
  );
}
