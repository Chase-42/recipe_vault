"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useSearch } from "../../providers";
import type { Recipe } from "~/types";
import LoadingSpinner from "./LoadingSpinner";
import { useMemo, useEffect, useCallback } from "react";
import Fuse from "fuse.js";
import RecipeCard from "./RecipeCard";
import { toast } from "sonner";
import { useInView } from "react-intersection-observer";

interface RecipesClientProps {
  initialRecipes: Recipe[];
}

// Fetch recipes with pagination support
const fetchRecipes = async ({
  pageParam = 0,
}): Promise<{ recipes: Recipe[]; nextCursor: number }> => {
  const response = await fetch(`/api/recipes?cursor=${pageParam}`);
  if (!response.ok) {
    throw new Error("Failed to fetch recipes");
  }
  const data = (await response.json()) as {
    recipes: Recipe[];
    nextCursor: number;
  };
  return data;
};

// Delete a recipe by ID
const deleteRecipe = async (id: number) => {
  const response = await fetch(`/api/recipes?id=${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete recipe");
  }
};

// Fuse.js options for fuzzy search
const fuseOptions = {
  keys: ["name"],
  threshold: 0.4,
};

const RecipesClient: React.FC<RecipesClientProps> = ({ initialRecipes }) => {
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
    initialData: {
      pages: [{ recipes: initialRecipes, nextCursor: 0 }],
      pageParams: [0],
    },
    initialPageParam: 0,
  });

  const allRecipes = useMemo(
    () => data?.pages.flatMap((page) => page.recipes) || initialRecipes,
    [data, initialRecipes],
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

  const { ref, inView } = useInView({ threshold: 0.5 });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage().catch((error) =>
        console.error("Failed to fetch next page:", error),
      );
    }
  }, [inView, hasNextPage, fetchNextPage]);

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
