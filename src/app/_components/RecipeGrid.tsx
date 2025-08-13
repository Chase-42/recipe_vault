"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { Recipe } from "~/types";
import RecipeCard from "./RecipeCard";
import LoadingSpinner from "./LoadingSpinner";
import { fetchRecipe } from "~/utils/recipeService";

interface RecipeGridProps {
  recipes: Recipe[];
  isLoading: boolean;
  currentPage: number;
  onDelete: (id: number) => void;
  onFavoriteToggle: (id: number) => void;
}

export default function RecipeGrid({
  recipes,
  isLoading,
  currentPage,
  onDelete,
  onFavoriteToggle,
}: RecipeGridProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Smart preloading on hover with rate limiting
  const handleRecipeHover = useCallback(
    (recipe: Recipe) => {
      const cacheKey = ["preloadedImages", recipe.id];
      if (!queryClient.getQueryData(cacheKey)) {
        // Load image
        const img = new Image();
        img.src = recipe.imageUrl;
        img.onload = () => {
          queryClient.setQueryData(cacheKey, true);
        };

        // Prefetch recipe data
        void queryClient.prefetchQuery({
          queryKey: ["recipe", recipe.id],
          queryFn: () => fetchRecipe(recipe.id),
          staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
        });

        // Prefetch related routes
        void router.prefetch(`/img/${recipe.id}`);
        void router.prefetch(`/edit/${recipe.id}`);
      }
    },
    [queryClient, router]
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (recipes.length === 0) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center text-lg text-muted-foreground">
        No recipes found
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-wrap justify-center gap-6 pb-8">
      {recipes.map((recipe) => (
        <div
          key={recipe.id}
          onMouseEnter={() => handleRecipeHover(recipe)}
          className="w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)]"
        >
          <RecipeCard
            recipe={recipe}
            onDelete={onDelete}
            onFavoriteToggle={onFavoriteToggle}
            priority={currentPage === 1 && recipe.id <= 4}
          />
        </div>
      ))}
    </div>
  );
}
