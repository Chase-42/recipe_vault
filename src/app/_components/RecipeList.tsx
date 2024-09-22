"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useSearch } from "../../providers";
import type { Recipe } from "~/types";
import LoadingSpinner from "./LoadingSpinner";
import { useMemo, useCallback, useEffect } from "react";
import Fuse from "fuse.js";
import RecipeCard from "./RecipeCard";
import { toast } from "sonner";
import { useInView } from "react-intersection-observer";
import { deleteRecipe, fetchRecipes } from "~/utils/recipeService";

// Fuse.js options for fuzzy search
const fuseOptions = {
  keys: ["name"],
  threshold: 0.4,
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

  const fuse = useMemo(() => new Fuse(allRecipes, fuseOptions), [allRecipes]);

  const filteredRecipes = useMemo(() => {
    if (!searchTerm) {
      return allRecipes;
    }
    return fuse.search(searchTerm).map(({ item }) => item);
  }, [allRecipes, searchTerm, fuse]);

  const handleDelete = useCallback(
    async (id: number) => {
      const previousData = queryClient.getQueryData<{
        pages: { recipes: Recipe[] }[];
      }>(["recipes"]);

      queryClient.setQueryData<{ pages: { recipes: Recipe[] }[] }>(
        ["recipes"],
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              recipes: page.recipes.filter((recipe) => recipe.id !== id),
            })),
          };
        },
      );

      try {
        await deleteRecipe(id);
        await queryClient.invalidateQueries({ queryKey: ["recipes"] });
        toast.success("Recipe deleted successfully");
      } catch (error) {
        queryClient.setQueryData<{ pages: { recipes: Recipe[] }[] }>(
          ["recipes"],
          previousData,
        );
        console.error("Failed to delete recipe:", error);
        toast.error("Failed to delete recipe");
      }
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
        <RecipeCard key={recipe.id} recipe={recipe} onDelete={handleDelete} />
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
