import { useMemo } from "react";
import Fuse from "fuse.js";
import type { Recipe } from "~/types";

const FUSE_OPTIONS = {
  keys: [
    { name: "name", weight: 0.6 },
    { name: "categories", weight: 0.2 },
    { name: "tags", weight: 0.2 }
  ],
  threshold: 0.4,
  includeScore: true,
  includeMatches: true,
};

type SortOption = "favorite" | "newest" | "oldest";

export function useRecipeFiltering(
  recipes: Recipe[],
  searchTerm: string,
  sortOption: SortOption
) {
  // Memoize the Fuse instance
  const fuse = useMemo(() => new Fuse(recipes, FUSE_OPTIONS), [recipes]);

  // Memoize search results
  const searchResults = useMemo(() => {
    if (!searchTerm) return recipes;
    const results = fuse.search(searchTerm);
    return results.map(({ item, score, matches }) => ({
      ...item,
      _score: score,
      _matches: matches
    }));
  }, [fuse, searchTerm, recipes]);

  // Memoize sorting
  return useMemo(() => {
    const result = [...searchResults];

    switch (sortOption) {
      case "favorite":
        result.sort((a, b) => {
          if (a.favorite === b.favorite) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return a.favorite ? -1 : 1;
        });
        break;
      case "newest":
        result.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "oldest":
        result.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
    }

    return result;
  }, [searchResults, sortOption]);
} 