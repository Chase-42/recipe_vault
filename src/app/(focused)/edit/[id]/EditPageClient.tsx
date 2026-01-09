"use client";
import { ArrowLeft } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import EditRecipeForm from "~/app/_components/EditRecipeForm";
import type { Recipe } from "~/types";
import {
  PageTransition,
  AnimatedBackButton,
} from "~/components/ui/page-transition";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { fetchRecipe } from "~/utils/recipeService";

interface EditPageClientProps {
  recipeId: number;
  initialRecipe?: Recipe | null;
}

export default function EditPageClient({
  recipeId,
  initialRecipe,
}: EditPageClientProps) {
  const queryClient = useQueryClient();
  const cachedData = queryClient.getQueryData<Recipe>(["recipe", recipeId]);
  const hasCachedData = !!cachedData;

  const { data: recipe, error, isLoading } = useQuery({
    queryKey: ["recipe", recipeId],
    queryFn: () => fetchRecipe(recipeId),
    initialData: cachedData ?? initialRecipe ?? undefined,
    placeholderData: cachedData ?? initialRecipe ?? undefined,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: !hasCachedData,
    refetchOnWindowFocus: false,
  });

  const displayRecipe = recipe ?? cachedData ?? initialRecipe;

  if (isLoading && !displayRecipe) {
    return (
      <PageTransition>
        <div className="flex h-full w-full flex-col">
          <div className="border-b p-2 flex items-center gap-4">
            <AnimatedBackButton className="h-8 w-8 rounded-full bg-transparent hover:bg-accent flex items-center justify-center">
              <ArrowLeft className="h-4 w-4" />
            </AnimatedBackButton>
            <h1 className="text-lg font-bold flex-1 text-center">
              Edit Recipe
            </h1>
            <div className="w-8" />
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex min-h-[60vh] items-center justify-center">
              <LoadingSpinner size="md" fullHeight={false} />
            </div>
          </div>
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
      <div className="flex h-full w-full flex-col">
        <div className="border-b p-2 flex items-center gap-4">
          <AnimatedBackButton className="h-8 w-8 rounded-full bg-transparent hover:bg-accent flex items-center justify-center">
            <ArrowLeft className="h-4 w-4" />
          </AnimatedBackButton>
          <h1 className="text-lg font-bold flex-1 text-center">Edit Recipe</h1>
          <div className="w-8" />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <EditRecipeForm initialRecipe={displayRecipe} />
        </div>
      </div>
    </PageTransition>
  );
}