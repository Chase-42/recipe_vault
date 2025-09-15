"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useSearch } from "~/providers";
import type { Category, PaginatedRecipes, Recipe, SortOption } from "~/types";
import { useRecipeFiltering } from "~/hooks/useRecipeFiltering";
import { useFavoriteToggle } from "~/hooks/useFavoriteToggle";
import { useUrlParams } from "~/hooks/useUrlParams";
import { deleteRecipe } from "~/utils/recipeService";
import RecipeFilters from "./RecipeFilters";
import RecipeGrid from "./RecipeGrid";
import RecipePagination from "./RecipePagination";

const ITEMS_PER_PAGE = 12;

interface RecipeListContainerProps {
  initialData?: PaginatedRecipes;
}

export default function RecipeListContainer({
  initialData: _initialData,
}: RecipeListContainerProps) {
  const { debouncedSearchTerm } = useSearch();
  const queryClient = useQueryClient();
  const { updateParam, getParam } = useUrlParams();
  const { toggleFavorite } = useFavoriteToggle();

  // URL params
  const currentPage = Number(getParam("page")) || 1;
  const sortOption = (getParam("sort") ?? "newest") as SortOption;
  const selectedCategory = (getParam("category") ?? "All") as Category;

  // Data fetching
  const { recipes, isLoading, pagination, shouldResetPage } =
    useRecipeFiltering(
      debouncedSearchTerm,
      sortOption,
      selectedCategory,
      currentPage,
      ITEMS_PER_PAGE
    );

  // Reset to page 1 if current page is invalid
  useEffect(() => {
    if (shouldResetPage) {
      updateParam("page", "1");
    }
  }, [shouldResetPage, updateParam]);

  const totalPages = pagination?.totalPages ?? 0;
  const total = pagination?.total ?? 0;

  // Delete mutation with optimistic updates
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
            recipes: old.recipes.filter((recipe: Recipe) => recipe.id !== id),
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

  const handleCategoryChange = useCallback(
    (value: Category) => {
      updateParam("category", value);
      if (currentPage !== 1) {
        updateParam("page", "1");
      }
    },
    [currentPage, updateParam]
  );

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
        setSelectedCategory={handleCategoryChange}
        sortOption={sortOption}
        onSortChange={handleSortChange}
      />

      <div className="min-h-[calc(100vh-160px)]">
        <RecipeGrid
          recipes={recipes}
          isLoading={isLoading}
          currentPage={currentPage}
          onDelete={handleDelete}
          onFavoriteToggle={handleFavoriteToggle}
        />
      </div>

      <RecipePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
