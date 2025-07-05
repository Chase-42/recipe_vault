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

      // Update recipes list if it exists
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
      queryClient.setQueryData<Recipe>(["recipe", recipe.id], {
        ...recipe,
        favorite: newFavoriteState,
      });
    },
    onError: (_, recipe) => {
      // Revert both caches on error
      const oldFavoriteState = recipe.favorite;

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

      queryClient.setQueryData<Recipe>(["recipe", recipe.id], {
        ...recipe,
        favorite: oldFavoriteState,
      });

      toast.error("Failed to update favorite status");
    },
    onSuccess: (data) => {
      toast.success(
        data.favorite ? "Added to favorites" : "Removed from favorites"
      );
    },
  });

  return {
    toggleFavorite: mutation.mutate,
    isLoading: mutation.isPending,
  };
}
