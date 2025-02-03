import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Recipe, PaginatedResponse } from "~/types";
import { updateRecipe } from "~/utils/recipeService";

export function useFavoriteToggle() {
  const queryClient = useQueryClient();

  const toggleFavorite = async (recipe: Recipe) => {
    const newFavoriteState = !recipe.favorite;

    // Optimistic updates for both individual recipe and list views
    queryClient.setQueryData(["recipe", recipe.id], {
      ...recipe,
      favorite: newFavoriteState,
    });

    // Update any existing recipe lists
    queryClient.setQueriesData<PaginatedResponse>(
      { queryKey: ["recipes"] },
      (old) => {
        if (!old) return old;
        return {
          ...old,
          recipes: old.recipes.map((r) =>
            r.id === recipe.id ? { ...r, favorite: newFavoriteState } : r
          ),
        };
      }
    );

    try {
      await updateRecipe({ ...recipe, favorite: newFavoriteState });
      // Invalidate all recipe queries to ensure proper sorting
      await queryClient.invalidateQueries({
        queryKey: ["recipes"],
        refetchType: "all",
      });
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