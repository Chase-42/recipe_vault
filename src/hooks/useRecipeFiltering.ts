import { useMemo } from "react";
import Fuse from "fuse.js";
import type { Recipe } from "~/types";

const FUSE_OPTIONS = {
  keys: ["name"],
  threshold: 0.5,
};

type SortOption = "favorite" | "newest" | "oldest";

export function useRecipeFiltering(
  recipes: Recipe[],
  searchTerm: string,
  sortOption: SortOption
) {
  return useMemo(() => {
    let result = [...recipes];

    // Search filtering
    if (searchTerm) {
      const fuse = new Fuse(result, FUSE_OPTIONS);
      result = fuse.search(searchTerm).map(({ item }) => item);
    }

    // Sorting
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
  }, [recipes, searchTerm, sortOption]);
} 