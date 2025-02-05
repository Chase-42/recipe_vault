import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Recipe } from "~/types";
import type { PaginatedRecipes } from "~/lib/schemas";
import { toggleFavorite as toggleFavoriteApi } from "~/utils/recipeService";

export function useFavoriteToggle() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (recipe: Recipe) => toggleFavoriteApi(recipe.id),
    onMutate: async (recipe) => {
      const newFavoriteState = !recipe.favorite;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["recipes"] });
      await queryClient.cancelQueries({ queryKey: ["recipe", recipe.id] });

      // Snapshot the previous value
      const previousRecipe = queryClient.getQueryData<Recipe>(["recipe", recipe.id]);

      // Optimistically update recipe
      queryClient.setQueryData(["recipe", recipe.id], {
        ...recipe,
        favorite: newFavoriteState,
      });

      // Optimistically update recipes list
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

      return {
        previousRecipe,
        invalidateQueries: [
          { queryKey: ["recipes"] },
          { queryKey: ["recipe", recipe.id] },
        ],
      };
    },
    onError: (_, recipe, context) => {
      // Revert optimistic updates on error
      if (context?.previousRecipe) {
        queryClient.setQueryData(["recipe", recipe.id], context.previousRecipe);
        queryClient.setQueriesData({ queryKey: ["recipes"] }, (old) => old);
      }
      toast.error("Failed to update favorite status");
    },
    onSuccess: (_, recipe) => {
      const newFavoriteState = !recipe.favorite;
      toast.success(
        newFavoriteState ? "Recipe favorited!" : "Recipe unfavorited."
      );
    },
  });

  return {
    toggleFavorite: (recipe: Recipe) => mutation.mutate(recipe),
    isLoading: mutation.isPending,
  };
} 