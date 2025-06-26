"use client";

import {
  useMutation,
  useQueryClient,
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { schemas } from "~/lib/schemas";
import { cn } from "~/lib/utils";
import { useSearch } from "~/providers";
import type { Category } from "~/types/category";
import type {
  RecipeWithCategories,
  PaginatedRecipes,
  SortOption,
} from "~/lib/schemas";

import LoadingSpinner from "~/app/_components/LoadingSpinner";

// Components
import RecipeCard from "./RecipeCard";
import RecipeFilters from "./RecipeFilters";
import RecipePagination from "./RecipePagination";

import { useFavoriteToggle } from "~/hooks/useFavoriteToggle";
import { useRecipeFiltering } from "~/hooks/useRecipeFiltering";
import { useUrlParams } from "~/hooks/useUrlParams";
import { deleteRecipe, fetchRecipe } from "~/utils/recipeService";

const ITEMS_PER_PAGE = 12;

interface RecipeListProps {
  initialData?: PaginatedRecipes;
}

function RecipeListContent({ initialData }: RecipeListProps) {
  const { debouncedSearchTerm } = useSearch();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { updateParam, getParam } = useUrlParams();
  const { toggleFavorite } = useFavoriteToggle();

  // State
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");

  // URL params
  const currentPage = Number(getParam("page")) || 1;
  const sortOption = schemas.sortOption.parse(getParam("sort") ?? "newest");

  // Data fetching with new backend search implementation
  const { recipes, isLoading, pagination } = useRecipeFiltering(
    debouncedSearchTerm,
    sortOption,
    selectedCategory,
    currentPage,
    ITEMS_PER_PAGE
  );

  // Update the recipes type
  const totalPages = pagination?.totalPages ?? 0;
  const total = pagination?.total ?? 0;

  // Delete mutation
  const deleteRecipeMutation = useMutation({
    mutationFn: deleteRecipe,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["recipes"] });
      const previousRecipes = queryClient.getQueryData<PaginatedRecipes>([
        "recipes",
      ]);

      if (previousRecipes) {
        queryClient.setQueryData<PaginatedRecipes>(["recipes"], (old) => {
          if (!old) return old;
          return {
            ...old,
            recipes: old.recipes.filter((recipe) => recipe.id !== id),
            pagination: {
              ...old.pagination,
              total: old.pagination.total - 1,
            },
          };
        });
      }

      return { previousRecipes };
    },
    onError: (_, __, context) => {
      if (context?.previousRecipes) {
        queryClient.setQueryData(["recipes"], context.previousRecipes);
      }
      toast.error("Failed to delete recipe");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["recipes"] });
      toast.success("Recipe deleted successfully");
    },
  });

  // Event handlers
  const handleDelete = useCallback(
    (id: number) => {
      void deleteRecipeMutation.mutateAsync(id);
    },
    [deleteRecipeMutation]
  );

  const handlePageChange = (page: number) => {
    updateParam("page", page.toString());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSortChange = useCallback(
    (value: SortOption) => {
      updateParam("sort", value);
      if (currentPage !== 1) {
        updateParam("page", "1");
      }
    },
    [currentPage, updateParam]
  );

  // Smart preloading on hover with rate limiting
  const handleRecipeHover = useCallback(
    (recipe: RecipeWithCategories) => {
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
        void router.prefetch(`/image/${recipe.id}`);
        void router.prefetch(`/edit/${recipe.id}`);
      }
    },
    [queryClient, router]
  );

  // Update the favorite toggle
  const handleFavoriteToggle = useCallback(
    (id: number) => {
      const recipe = recipes.find((r) => r.id === id);
      if (!recipe) return;
      toggleFavorite(recipe);
    },
    [recipes, toggleFavorite]
  );

  return (
    <div className="p-4">
      <RecipeFilters
        total={total}
        offset={(currentPage - 1) * ITEMS_PER_PAGE}
        itemsPerPage={ITEMS_PER_PAGE}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        sortOption={sortOption}
        onSortChange={handleSortChange}
      />

      <div className="min-h-[calc(100vh-160px)]">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="mx-auto flex w-full max-w-[1200px] flex-wrap justify-center gap-6 pb-8">
            {recipes.length === 0 ? (
              <div className="flex h-[50vh] w-full items-center justify-center text-lg text-muted-foreground">
                No recipes found
              </div>
            ) : (
              recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  onMouseEnter={() => handleRecipeHover(recipe)}
                  className="w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)]"
                >
                  <RecipeCard
                    recipe={recipe}
                    onDelete={handleDelete}
                    onFavoriteToggle={handleFavoriteToggle}
                    priority={currentPage === 1 && recipe.id <= 4}
                  />
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <RecipePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

export default function RecipeList({ initialData }: RecipeListProps) {
  // If we have initial data, hydrate it into the query client
  if (initialData) {
    const queryClient = new QueryClient();

    queryClient.setQueryData(
      [
        "recipes",
        { searchTerm: "", sortOption: "newest", category: "all", page: 1 },
      ],
      initialData
    );

    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <RecipeListContent />
      </HydrationBoundary>
    );
  }

  // No initial data, just render normally
  return <RecipeListContent />;
}
