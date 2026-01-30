import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { PaginatedRecipes, Recipe } from "~/types";
import { toggleFavorite as toggleFavoriteApi } from "~/utils/recipeService";
import { recipesKey, recipeKey } from "~/utils/query-keys";

type FavoriteToggleInput = Pick<Recipe, "id" | "favorite">;

export function useFavoriteToggle() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (recipe: FavoriteToggleInput) => {
      const response = await toggleFavoriteApi(recipe.id);
      return { id: recipe.id, favorite: response };
    },
    onMutate: async (recipe) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: recipesKey() });
      await queryClient.cancelQueries({ queryKey: recipeKey(recipe.id) });

      // Update both the list and individual recipe cache
      const newFavoriteState = !recipe.favorite;

      // Update recipes list if it exists - only update the specific recipe
      queryClient.setQueriesData<PaginatedRecipes>(
        { queryKey: recipesKey() },
        (old) => {
          if (!old?.recipes) return old;
          return {
            ...old,
            recipes: old.recipes.map((r) =>
              r.id === recipe.id ? { ...r, favorite: newFavoriteState } : r
            ),
          };
        }
      );

      // Update individual recipe if it exists (dynamic query key)
      const previousRecipe = queryClient.getQueryData<Recipe>(recipeKey(recipe.id));
      queryClient.setQueryData<Recipe>(recipeKey(recipe.id), (old) => {
        if (!old) return old;
        return { ...old, favorite: newFavoriteState };
      });

      // Return context for rollback
      return { previousRecipe: previousRecipe ?? recipe };
    },
    onError: (_, recipe, context) => {
      // Revert both caches on error
      const optimisticContext = context as { previousRecipe: Recipe } | undefined;
      const oldFavoriteState =
        optimisticContext?.previousRecipe?.favorite ?? recipe.favorite;

      queryClient.setQueriesData<PaginatedRecipes>(
        { queryKey: recipesKey() },
        (old) => {
          if (!old?.recipes) return old;
          return {
            ...old,
            recipes: old.recipes.map((r) =>
              r.id === recipe.id ? { ...r, favorite: oldFavoriteState } : r
            ),
          };
        }
      );

      queryClient.setQueryData<Recipe>(recipeKey(recipe.id), (old) => {
        if (!old) return old;
        return { ...old, favorite: oldFavoriteState };
      });

      toast.error("Failed to update favorite status");
    },
    onSettled: async (_, __, recipe) => {
      // Invalidate to sync with server - only invalidate the specific recipe, not all recipes
      await queryClient.invalidateQueries({ queryKey: recipesKey() });
      await queryClient.invalidateQueries({ queryKey: recipeKey(recipe.id) });
    },
    onSuccess: (data) => {
      // Show toast with minimal delay
      toast.success(
        data.favorite ? "Added to favorites" : "Removed from favorites",
        {
          duration: 2000,
        }
      );
    },
  });

  return {
    toggleFavorite: mutation.mutate,
    isLoading: mutation.isPending,
  };
}
