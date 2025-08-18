import { useQuery } from "@tanstack/react-query";
import { fetchRecipes } from "~/utils/recipeService";
import type { Category, SortOption } from "~/types";

export function useRecipeFiltering(
  searchTerm: string,
  sortOption: SortOption,
  category: Category,
  page = 1,
  itemsPerPage = 12
) {
  const queryKey = ["recipes", { searchTerm, sortOption, category, page }];

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
    // Enhanced caching strategy
    staleTime: 1000 * 60 * 5, // 5 minutes - data considered fresh
    gcTime: 1000 * 60 * 30, // 30 minutes - keep in cache
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnMount: false, // Use cached data when possible
    refetchOnReconnect: true, // Refetch when reconnecting
    // Background refetching for better UX
    refetchInterval: (data) => {
      // Refetch every 10 minutes if data is stale
      return data ? 1000 * 60 * 10 : false;
    },
    refetchIntervalInBackground: true,
  });

  // If we have no results and we're not on page 1, the page is likely invalid
  const hasResults = data?.recipes && data.recipes.length > 0;
  const totalPages = data?.pagination?.totalPages ?? 0;
  const shouldResetPage =
    !hasResults && page > 1 && totalPages > 0 && page > totalPages;

  return {
    recipes: data?.recipes ?? [],
    isLoading,
    isFetching, // Expose fetching state for better UX
    pagination: data?.pagination,
    shouldResetPage,
  };
}
