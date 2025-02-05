import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Recipe } from "~/types";
import type { PaginatedRecipes } from "~/lib/schemas";
import { updateRecipe } from "~/utils/recipeService";

type MutationType = "create" | "update";

export function useRecipeMutation(type: MutationType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Recipe>) => {
      if (type === "create") {
        const response = await fetch("/api/recipes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          throw new Error("Failed to create recipe");
        }
        return response.json();
      }
      return updateRecipe(data as Recipe);
    },
    onMutate: async (data: Partial<Recipe>) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["recipes"] });
      if (type === "update" && "id" in data) {
        await queryClient.cancelQueries({ queryKey: ["recipe", data.id] });
      }

      // Snapshot the previous values
      const previousRecipes = queryClient.getQueryData<PaginatedRecipes>(["recipes"]);
      const previousRecipe = type === "update" && "id" in data
        ? queryClient.getQueryData<Recipe>(["recipe", data.id])
        : undefined;

      // Optimistically update recipes list
      if (previousRecipes) {
        queryClient.setQueryData<PaginatedRecipes>(["recipes"], old => {
          if (!old) return old;
          if (type === "create") {
            return {
              ...old,
              recipes: [{ ...data, id: -1 } as Recipe, ...old.recipes],
              pagination: {
                ...old.pagination,
                total: old.pagination.total + 1
              }
            };
          }
          return {
            ...old,
            recipes: old.recipes.map(recipe =>
              recipe.id === (data as Recipe).id ? { ...recipe, ...data } : recipe
            ),
          };
        });
      }

      // Optimistically update single recipe view for updates
      if (type === "update" && "id" in data) {
        queryClient.setQueryData<Recipe>(["recipe", data.id], old => {
          if (!old) return old;
          return { ...old, ...data };
        });
      }

      return {
        previousRecipes,
        previousRecipe,
        invalidateQueries: [
          { queryKey: ["recipes"] },
          ...(type === "update" && "id" in data ? [{ queryKey: ["recipe", data.id] }] : []),
        ],
      };
    },
    onError: (_, __, context) => {
      // Revert optimistic updates on error
      if (context?.previousRecipes) {
        queryClient.setQueryData(["recipes"], context.previousRecipes);
      }
      if (type === "update" && context?.previousRecipe) {
        queryClient.setQueryData(["recipe", context.previousRecipe.id], context.previousRecipe);
      }
      toast.error(`Failed to ${type} recipe`);
    },
    onSuccess: () => {
      toast.success(`Recipe ${type === "create" ? "created" : "updated"} successfully`);
    },
  });
} 