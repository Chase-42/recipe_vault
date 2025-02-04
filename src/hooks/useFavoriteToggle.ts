import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Recipe } from "~/types";
import type { PaginatedRecipes } from "~/lib/schemas";
import { toggleFavorite as toggleFavoriteApi } from "~/utils/recipeService";

export function useFavoriteToggle() {
  const queryClient = useQueryClient();

  const toggleFavorite = async (recipe: Recipe) => {
    const newFavoriteState = !recipe.favorite;

    try {
      // Optimistic updates for both individual recipe and list views
      queryClient.setQueryData(["recipe", recipe.id], {
        ...recipe,
        favorite: newFavoriteState,
      });

      queryClient.setQueriesData<PaginatedRecipes>(
        { queryKey: ["recipes"] },
        (old: PaginatedRecipes | undefined) => {
          if (!old) return old;
          return {
            ...old,
            recipes: old.recipes.map((r: Recipe) =>
              r.id === recipe.id ? { ...r, favorite: newFavoriteState } : r
            ),
          };
        }
      );

      await toggleFavoriteApi(recipe.id);
      toast.success(newFavoriteState ? "Recipe favorited!" : "Recipe unfavorited.");
    } catch {
      // Revert optimistic updates on error
      queryClient.setQueryData(["recipe", recipe.id], recipe);
      queryClient.setQueriesData({ queryKey: ["recipes"] }, (old) => old);
      toast.error("Failed to update favorite status");
    }
  };

  return { toggleFavorite };
} 