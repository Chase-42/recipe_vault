import { useQuery } from "@tanstack/react-query";
import { fetchRecipes } from "~/utils/recipeService";
import type { Category } from "~/types/category";

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
  const { data, isLoading } = useQuery({
    queryKey: ["recipes", { searchTerm, sortOption, category, page }],
    queryFn: () =>
      fetchRecipes({
        searchTerm,
        sortOption,
        category,
        offset: (page - 1) * itemsPerPage,
        limit: itemsPerPage,
      }),
  });

  return {
    recipes: data?.recipes ?? [],
    isLoading,
    pagination: data?.pagination,
  };
}
