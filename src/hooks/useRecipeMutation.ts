import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RecipeError, ValidationError } from "~/lib/errors";
import type {
  Recipe,
  PaginatedRecipes,
  CreateRecipeInput,
  UpdateRecipeInput,
  MutationType,
} from "~/types";
import { updateRecipe } from "~/utils/recipeService";

export function useRecipeMutation(type: MutationType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateRecipeInput | (UpdateRecipeInput & { id: number })
    ) => {
      if (type === "create") {
        const response = await fetch("/api/recipes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          throw new RecipeError("Failed to create recipe", 500);
        }
        return response.json();
      }

      // For updates, we need to pass the ID separately
      const updateData = data as UpdateRecipeInput & { id: number };
      if (!updateData.id)
        throw new ValidationError("Recipe ID is required for update");

      // Convert UpdateRecipeInput to UpdatedRecipe format
      const { id, ...updateFields } = updateData;
      const updatedRecipe = {
        id,
        favorite: updateFields.favorite ?? false,
        name: updateFields.name ?? "",
        instructions: updateFields.instructions ?? "",
        ingredients: updateFields.ingredients ?? "",
        imageUrl: updateFields.imageUrl ?? "",
      };

      return updateRecipe(updatedRecipe);
    },
    onMutate: async (
      data: CreateRecipeInput | (UpdateRecipeInput & { id: number })
    ) => {
      await queryClient.cancelQueries({ queryKey: ["recipes"] });
      if (type === "update" && "id" in data) {
        await queryClient.cancelQueries({ queryKey: ["recipe", data.id] });
      }

      const previousRecipes = queryClient.getQueryData<PaginatedRecipes>([
        "recipes",
      ]);
      const previousRecipe =
        type === "update" && "id" in data
          ? queryClient.getQueryData<Recipe>(["recipe", data.id])
          : undefined;

      if (previousRecipes) {
        queryClient.setQueryData<PaginatedRecipes>(["recipes"], (old) => {
          if (!old) return old;
          if (type === "create" && isCreateRecipeInput(data)) {
            const newRecipe: Recipe = {
              id: -1,
              ...data,
              blurDataUrl: "", // Will be set by the server
              createdAt: new Date().toISOString(),
            };
            return {
              ...old,
              recipes: [newRecipe, ...old.recipes],
              pagination: {
                ...old.pagination,
                total: old.pagination.total + 1,
              },
            };
          }
          return {
            ...old,
            recipes: old.recipes.map((recipe) =>
              recipe.id === (data as UpdateRecipeInput & { id: number }).id
                ? { ...recipe, ...data }
                : recipe
            ),
          };
        });
      }

      if (type === "update" && "id" in data) {
        queryClient.setQueryData<Recipe>(["recipe", data.id], (old) => {
          if (!old) return old;
          return { ...old, ...data };
        });
      }

      return {
        previousRecipes,
        previousRecipe,
        invalidateQueries: [
          { queryKey: ["recipes"] },
          ...(type === "update" && "id" in data
            ? [{ queryKey: ["recipe", data.id] }]
            : []),
        ],
      };
    },
    onError: (_, __, context) => {
      if (context?.previousRecipes) {
        queryClient.setQueryData(["recipes"], context.previousRecipes);
      }
      if (type === "update" && context?.previousRecipe) {
        queryClient.setQueryData(
          ["recipe", context.previousRecipe.id],
          context.previousRecipe
        );
      }
      toast.error(`Failed to ${type} recipe`);
    },
    onSuccess: () => {
      toast(`Recipe ${type === "create" ? "created" : "updated"}`);
    },
  });
}

// Type guard to ensure we have a complete CreateRecipeInput
function isCreateRecipeInput(
  data: CreateRecipeInput | (UpdateRecipeInput & { id: number })
): data is CreateRecipeInput {
  return !("id" in data);
}
