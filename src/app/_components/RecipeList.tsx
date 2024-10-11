"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useSearch } from "../../providers";
import type { RecipesData } from "~/types";
import LoadingSpinner from "./LoadingSpinner";
import { useMemo, useCallback, useEffect } from "react";
import Fuse from "fuse.js";
import RecipeCard from "./RecipeCard";
import { toast } from "sonner";
import { useInView } from "react-intersection-observer";
import {
  deleteRecipe,
  fetchRecipes,
  updateRecipe,
} from "~/utils/recipeService";
import {
  performMutationWithRollback,
  updateRecipesInCache,
} from "~/utils/recipeCacheUtils";

// Fuse.js options for fuzzy search
const fuseOptions = {
  keys: ["name"],
  threshold: 0.5,
};

const RecipesClient: React.FC = () => {
  const { searchTerm } = useSearch();
  const queryClient = useQueryClient();

  const {
    data,
    error,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["recipes"],
    queryFn: fetchRecipes,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
  });

  const allRecipes = useMemo(
    () => data?.pages.flatMap((page) => page.recipes) ?? [],
    [data],
  );

  const fuse = useMemo(() => {
    if (!searchTerm) return null;
    return new Fuse(allRecipes, fuseOptions);
  }, [allRecipes, searchTerm]);

  const filteredRecipes = useMemo(() => {
    if (!searchTerm || !fuse) {
      return allRecipes;
    }
    return fuse.search(searchTerm).map(({ item }) => item);
  }, [allRecipes, searchTerm, fuse]);

  const handleFavoriteToggle = useCallback(
    async (id: number, favorite: boolean) => {
      const previousData = queryClient.getQueryData<RecipesData>(["recipes"]);

      // Optimistic update
      updateRecipesInCache(queryClient, (recipes) =>
        recipes.map((recipe) =>
          recipe.id === id ? { ...recipe, favorite } : recipe,
        ),
      );

      const updatedRecipe = previousData?.pages
        .flatMap((page) => page.recipes)
        .find((recipe) => recipe.id === id);

      if (!updatedRecipe) {
        // Roll back to previous data
        queryClient.setQueryData(["recipes"], previousData);
        toast.error("Recipe not found");
        return;
      }

      await performMutationWithRollback(
        () => updateRecipe({ ...updatedRecipe, favorite }),
        queryClient,
        previousData,
        favorite ? "Recipe favorited!" : "Recipe unfavorited.",
        "Failed to update favorite status.",
      );
    },
    [queryClient],
  );

  const handleDelete = useCallback(
    async (id: number) => {
      const previousData = queryClient.getQueryData<RecipesData>(["recipes"]);

      // Optimistic update
      updateRecipesInCache(queryClient, (recipes) =>
        recipes.filter((recipe) => recipe.id !== id),
      );

      await performMutationWithRollback(
        () => deleteRecipe(id),
        queryClient,
        previousData,
        "Recipe deleted successfully",
        "Failed to delete recipe",
      );
    },
    [queryClient],
  );

  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: "0px 0px 100px 0px",
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage().catch((error) =>
        console.error("Failed to fetch next page:", error),
      );
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-xl text-red-800">Error loading recipes</div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-4 p-4">
      {filteredRecipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          onDelete={handleDelete}
          onFavoriteToggle={handleFavoriteToggle}
        />
      ))}
      {isFetchingNextPage && (
        <div className="flex w-full items-center justify-center py-4">
          <LoadingSpinner />
        </div>
      )}
      <div ref={ref as unknown as React.RefObject<HTMLDivElement>} />
    </div>
  );
};

export default RecipesClient;
