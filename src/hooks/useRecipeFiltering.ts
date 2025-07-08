import { useQuery } from "@tanstack/react-query";
import { fetchRecipes } from "~/utils/recipeService";
import type { Category, PaginatedRecipes, SortOption } from "~/types";

const FUSE_OPTIONS = {
  keys: [
    { name: "name", weight: 0.6 },
    { name: "categories", weight: 0.2 },
    { name: "tags", weight: 0.2 },
  ],
  threshold: 0.4,
  includeScore: true,
  includeMatches: true,
};

export function useRecipeFiltering(
  searchTerm: string,
  sortOption: SortOption,
  category: Category,
  page = 1,
  itemsPerPage = 12
) {
  const queryKey = ["recipes", { searchTerm, sortOption, category, page }];

  const { data, isLoading } = useQuery({
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
  });

  // If we have no results and we're not on page 1, the page is likely invalid
  const hasResults = data?.recipes && data.recipes.length > 0;
  const totalPages = data?.pagination?.totalPages ?? 0;
  const shouldResetPage =
    !hasResults && page > 1 && totalPages > 0 && page > totalPages;

  return {
    recipes: data?.recipes ?? [],
    isLoading,
    pagination: data?.pagination,
    shouldResetPage,
  };
}
