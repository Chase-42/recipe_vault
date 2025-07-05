import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { PaginatedRecipes, Recipe } from "~/types";
import { toggleFavorite as toggleFavoriteApi } from "~/utils/recipeService";

export function useFavoriteToggle() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (recipe: Recipe) => {
      const response = await toggleFavoriteApi(recipe.id);
      return { id: recipe.id, favorite: response };
    },
    onMutate: async (recipe) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["recipes"] });
      await queryClient.cancelQueries({ queryKey: ["recipe", recipe.id] });

      // Update both the list and individual recipe cache
      const newFavoriteState = !recipe.favorite;

      // Update recipes list if it exists - only update the specific recipe
      queryClient.setQueriesData<PaginatedRecipes>(
        { queryKey: ["recipes"] },
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

      // Update individual recipe if it exists
      queryClient.setQueryData<Recipe>(["recipe", recipe.id], (old) => {
        if (!old) return old;
        return { ...old, favorite: newFavoriteState };
      });

      // Return context for rollback
      return { previousRecipe: recipe };
    },
    onError: (_, recipe, context) => {
      // Revert both caches on error
      const oldFavoriteState =
        context?.previousRecipe?.favorite ?? recipe.favorite;

      queryClient.setQueriesData<PaginatedRecipes>(
        { queryKey: ["recipes"] },
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

      queryClient.setQueryData<Recipe>(["recipe", recipe.id], (old) => {
        if (!old) return old;
        return { ...old, favorite: oldFavoriteState };
      });

      toast.error("Failed to update favorite status");
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
