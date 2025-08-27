"use client";

import { useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { Recipe } from "~/types";
import RecipeCard from "./RecipeCard";
import LoadingSpinner from "./LoadingSpinner";
import { fetchRecipe } from "~/utils/recipeService";
import { logger } from "~/lib/logger";

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
  const preloadQueue = useRef<Set<number>>(new Set());
  const isProcessing = useRef(false);

  // Process preload queue with rate limiting
  const processPreloadQueue = useCallback(async () => {
    if (isProcessing.current || preloadQueue.current.size === 0) return;

    isProcessing.current = true;
    const recipeId = Array.from(preloadQueue.current)[0];
    if (recipeId === undefined) {
      isProcessing.current = false;
      return;
    }
    preloadQueue.current.delete(recipeId);

    try {
      const cacheKey = ["preloadedImages", recipeId];
      if (!queryClient.getQueryData(cacheKey)) {
        // Preload image
        const img = new Image();
        img.src = recipes.find((r) => r.id === recipeId)?.imageUrl || "";
        img.onload = () => {
          queryClient.setQueryData(cacheKey, true);
        };

        // Prefetch recipe data with better caching
        void queryClient.prefetchQuery({
          queryKey: ["recipe", recipeId],
          queryFn: () => fetchRecipe(recipeId),
          staleTime: 1000 * 60 * 5, // 5 minutes
          gcTime: 1000 * 60 * 30, // 30 minutes
        });

        // Prefetch routes
        void router.prefetch(`/img/${recipeId}`);
        void router.prefetch(`/edit/${recipeId}`);
      }
    } catch (error) {
      logger.warn("Failed to preload recipe", { recipeId, error });
    } finally {
      isProcessing.current = false;
      // Process next item after a small delay
      setTimeout(() => {
        if (preloadQueue.current.size > 0) {
          processPreloadQueue();
        }
      }, 100);
    }
  }, [queryClient, router, recipes]);

  // Smart preloading on hover with queue management
  const handleRecipeHover = useCallback(
    (recipe: Recipe) => {
      if (!preloadQueue.current.has(recipe.id)) {
        preloadQueue.current.add(recipe.id);
        processPreloadQueue();
      }
    },
    [processPreloadQueue]
  );

  // Intersection Observer for lazy loading optimization
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const recipeId = Number.parseInt(
              entry.target.getAttribute("data-recipe-id") || "0",
              10
            );
            if (recipeId && !preloadQueue.current.has(recipeId)) {
              preloadQueue.current.add(recipeId);
              processPreloadQueue();
            }
          }
        }
      },
      {
        rootMargin: "100px", // Start loading 100px before visible
        threshold: 0.1,
      }
    );

    // Observe all recipe cards
    const cards = document.querySelectorAll("[data-recipe-id]");
    for (const card of cards) {
      observer.observe(card);
    }

    return () => observer.disconnect();
  }, [processPreloadQueue]);

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
    <div className="relative">
      <div className="mx-auto flex w-full max-w-[1200px] flex-wrap justify-center gap-6 pb-8">
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            data-recipe-id={recipe.id}
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
    </div>
  );
}
