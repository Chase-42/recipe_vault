import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Recipe, UpdatedRecipe } from "~/lib/schemas";
import type { PaginatedRecipes } from "~/lib/schemas";
import { updateRecipe } from "~/utils/recipeService";

type MutationType = "create" | "update";

type CreateRecipeInput = Omit<Recipe, "id">;
type UpdateRecipeInput = UpdatedRecipe & { id: number };

export function useRecipeMutation(type: MutationType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRecipeInput | UpdateRecipeInput) => {
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

      const updateData = data as UpdateRecipeInput;
      if (!updateData.id) throw new Error("Recipe ID is required for update");
      return updateRecipe(updateData);
    },
    onMutate: async (data: CreateRecipeInput | UpdateRecipeInput) => {
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
              link: data.link ?? "",
              blurDataUrl: data.blurDataUrl ?? "",
              favorite: data.favorite ?? false,
              createdAt: data.createdAt ?? new Date().toISOString(),
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
              recipe.id === (data as UpdateRecipeInput).id
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
  data: CreateRecipeInput | UpdateRecipeInput
): data is CreateRecipeInput {
  return !("id" in data);
}
