import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
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
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnReconnect: true,
  });

  const totalPages = data?.pagination?.totalPages ?? 0;

  // Prefetch next page for instant pagination
  useEffect(() => {
    if (page < totalPages) {
      const nextKey = recipesKey({
        searchTerm,
        sortOption,
        category,
        page: page + 1,
      });
      void queryClient.prefetchQuery({
        queryKey: nextKey,
        queryFn: () =>
          fetchRecipes({
            searchTerm,
            sortOption,
            category,
            offset: page * itemsPerPage,
            limit: itemsPerPage,
          }),
        staleTime: 1000 * 60 * 5,
      });
    }
  }, [
    page,
    totalPages,
    searchTerm,
    sortOption,
    category,
    itemsPerPage,
    queryClient,
  ]);

  const hasResults = data?.recipes && data.recipes.length > 0;
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
