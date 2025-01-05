"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useSearch } from "../../providers";
import type { Recipe, RecipesData } from "~/types";
import LoadingSpinner from "./LoadingSpinner";
import { useMemo, useCallback, useEffect, useState } from "react";
import Fuse from "fuse.js";
import RecipeCard from "./RecipeCard";
import { toast } from "sonner";
import { useInView } from "react-intersection-observer";
import {
  deleteRecipe,
  fetchRecipe,
  fetchRecipes,
  updateRecipe,
} from "~/utils/recipeService";
import {
  performMutationWithRollback,
  updateRecipesInCache,
} from "~/utils/recipeCacheUtils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useRouter } from "next/navigation";

// Fuse.js options for fuzzy search
const fuseOptions = {
  keys: ["name"],
  threshold: 0.5,
};

const RecipesClient: React.FC = () => {
  const { searchTerm } = useSearch();
  const queryClient = useQueryClient();
  const router = useRouter();

  // State for sorting option
  const [sortOption, setSortOption] = useState("newest");

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

  const handleRecipeHover = useCallback(
    async (recipe: Recipe) => {
      // Prefetch routes
      router.prefetch(`/img/${recipe.id}`);
      router.prefetch(`/edit/${recipe.id}`);

      // Prefetch the recipe query data
      await queryClient.prefetchQuery({
        queryKey: ["recipe", recipe.id],
        queryFn: () => fetchRecipe(recipe.id),
      });

      // Preload image
      const img = new Image();
      img.src = recipe.imageUrl;
      console.log("Preloaded image:", img);
    },
    [queryClient, router],
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

  // Implement sorting
  const sortedRecipes = useMemo(() => {
    const recipes = [...filteredRecipes]; // Create a shallow copy

    switch (sortOption) {
      case "favorite":
        recipes.sort((a, b) =>
          a.favorite === b.favorite ? 0 : a.favorite ? -1 : 1,
        );
        break;
      case "newest":
        recipes.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      case "oldest":
        recipes.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        break;
      default:
        break;
    }

    return recipes;
  }, [filteredRecipes, sortOption]);

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
    <div className="p-4">
      {/* Top bar with Select component */}
      <div className="mb-4 flex justify-end">
        <Select value={sortOption} onValueChange={setSortOption}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Sort Recipes By:</SelectLabel>
              <SelectItem value="favorite">Favorite</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Recipes Grid */}
      <div className="flex flex-wrap justify-center gap-4">
        {sortedRecipes.map((recipe, index) => (
          <div key={recipe.id} onMouseEnter={() => handleRecipeHover(recipe)}>
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onDelete={handleDelete}
              priority={index < 2}
              onFavoriteToggle={handleFavoriteToggle}
            />
          </div>
        ))}
      </div>

      {/* Loading Spinner for Fetching Next Page */}
      {isFetchingNextPage && (
        <div className="flex w-full items-center justify-center py-4">
          <LoadingSpinner />
        </div>
      )}

      {/* Intersection Observer Ref */}
      <div ref={ref as unknown as React.RefObject<HTMLDivElement>} />
    </div>
  );
};

export default RecipesClient;
