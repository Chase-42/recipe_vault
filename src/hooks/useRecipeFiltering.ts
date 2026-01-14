import { useQuery } from "@tanstack/react-query";
import { fetchRecipes } from "~/utils/recipeService";
import type { Category, SortOption } from "~/types";
import { recipesKey } from "~/utils/query-keys";

export function useRecipeFiltering(
  searchTerm: string,
  sortOption: SortOption,
  category: Category,
  page = 1,
  itemsPerPage = 12
) {
  const queryKey = recipesKey({ searchTerm, sortOption, category, page });

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: async () => {
      return await fetchRecipes({
        searchTerm,
        sortOption,
        category,
        offset: (page - 1) * itemsPerPage,
        limit: itemsPerPage,
      });
    },
    gcTime: 1000 * 60 * 30, // 30 minutes (longer than default for recipe data)
    refetchOnMount: false,
    refetchOnReconnect: true,
  });

  const hasResults = data?.recipes && data.recipes.length > 0;
  const totalPages = data?.pagination?.totalPages ?? 0;
  const shouldResetPage =
    !hasResults && page > 1 && totalPages > 0 && page > totalPages;

  return {
    recipes: data?.recipes ?? [],
    isLoading,
    isFetching,
    pagination: data?.pagination,
    shouldResetPage,
  };
}
