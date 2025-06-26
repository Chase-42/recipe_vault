import { useQuery } from "@tanstack/react-query";
import { fetchRecipes } from "~/utils/recipeService";
import type { Category } from "~/types/category";
import type { PaginatedRecipes } from "~/lib/schemas";

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

type SortOption = "favorite" | "newest" | "oldest";

export function useRecipeFiltering(
  searchTerm: string,
  sortOption: SortOption,
  category: Category,
  page = 1,
  itemsPerPage = 12
) {
  const queryKey = ["recipes", { searchTerm, sortOption, category, page }];
  console.time(`useRecipeFiltering: ${JSON.stringify(queryKey)}`);

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      console.time(`fetchRecipes call: ${JSON.stringify(queryKey)}`);
      const result = await fetchRecipes({
        searchTerm,
        sortOption,
        category,
        offset: (page - 1) * itemsPerPage,
        limit: itemsPerPage,
      });
      console.timeEnd(`fetchRecipes call: ${JSON.stringify(queryKey)}`);
      return result;
    },
  });

  console.timeEnd(`useRecipeFiltering: ${JSON.stringify(queryKey)}`);

  return {
    recipes: data?.recipes ?? [],
    isLoading,
    pagination: data?.pagination,
  };
}
