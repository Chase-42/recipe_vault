import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RecipeError, ValidationError } from "~/lib/errors";
import type {
  Recipe,
  PaginatedRecipes,
  CreateRecipeInput,
  UpdateRecipeInput,
  MutationType,
} from "~/types";
import { updateRecipe, createRecipe } from "~/utils/recipeService";
import { createOptimisticMutation } from "~/utils/optimisticUpdates";
import { recipesKey, recipeKey } from "~/utils/query-keys";

export interface UseRecipeMutationOptions {
  onSuccessNavigate?: () => void;
  disableNavigation?: boolean;
}

// Function overloads for type narrowing
export function useRecipeMutation(
  type: "create",
  options?: UseRecipeMutationOptions
): UseMutationResult<
  Recipe,
  Error,
  CreateRecipeInput,
  { previousRecipes?: PaginatedRecipes }
>;
export function useRecipeMutation(
  type: "update",
  options?: UseRecipeMutationOptions
): UseMutationResult<
  Recipe,
  Error,
  UpdateRecipeInput & { id: number },
  { previousRecipes?: PaginatedRecipes; previousRecipe?: Recipe }
>;
export function useRecipeMutation(
  type: MutationType,
  options?: UseRecipeMutationOptions
) {
  const queryClient = useQueryClient();
  const router = useRouter();

  // For create mutations, use the standardized optimistic updates helper
  if (type === "create") {
    const createOptimisticHelpers = createOptimisticMutation<
      PaginatedRecipes,
      CreateRecipeInput,
      Error,
      { previousRecipes?: PaginatedRecipes }
    >(queryClient, {
      multiQuery: {
        queryKey: recipesKey(),
        updater: (
          old: PaginatedRecipes | undefined,
          variables: CreateRecipeInput
        ): PaginatedRecipes | undefined => {
          if (!old?.recipes) return old;
          const newRecipe: Recipe = {
            id: -1,
            ...variables,
            blurDataUrl: "",
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
        },
      },
      invalidateQueries: [recipesKey()],
    });

    return useMutation<Recipe, Error, CreateRecipeInput, { previousRecipes?: PaginatedRecipes }>({
      mutationFn: async (data: CreateRecipeInput) => {
        return await createRecipe(data);
      },
      onMutate: createOptimisticHelpers.onMutate,
      onError: createOptimisticHelpers.onError,
      onSettled: async (data, error, variables, context) => {
        // The helper's onSettled expects PaginatedRecipes but we have Recipe
        // We'll just invalidate queries ourselves
        await queryClient.invalidateQueries({ queryKey: recipesKey() });
      },
      onSuccess: (data) => {
        toast("Recipe created successfully!");
        if (!options?.disableNavigation && options?.onSuccessNavigate) {
          options.onSuccessNavigate();
        }
      },
    }) as UseMutationResult<
      Recipe,
      Error,
      CreateRecipeInput,
      { previousRecipes?: PaginatedRecipes }
    >;
  }

  // For update mutations, we need to handle dynamic query keys manually
  // but we can still use the helper for the recipes list update
  // Note: We need to capture previousRecipes manually for rollback since helper
  // only captures previousData for singleQuery, not multiQuery
  const updateOptimisticHelpers = createOptimisticMutation<
    PaginatedRecipes,
    UpdateRecipeInput & { id: number },
    Error,
    { previousRecipes?: PaginatedRecipes; previousRecipe?: Recipe }
  >(queryClient, {
    multiQuery: {
      queryKey: recipesKey(),
      updater: (
        old: PaginatedRecipes | undefined,
        variables: UpdateRecipeInput & { id: number }
      ): PaginatedRecipes | undefined => {
        if (!old?.recipes) return old;
        return {
          ...old,
          recipes: old.recipes.map((recipe) =>
            recipe.id === variables.id ? { ...recipe, ...variables } : recipe
          ),
        };
      },
      rollback: (
        old: PaginatedRecipes | undefined,
        variables: UpdateRecipeInput & { id: number }
      ): PaginatedRecipes | undefined => {
        // Rollback is handled manually in onError using previousRecipes from context
        return old;
      },
    },
    cancelQueries: [recipesKey()],
    invalidateQueries: [recipesKey()],
    getContext: (variables, previousData) => {
      // Capture previousRecipes for manual rollback
      const previousRecipes = queryClient.getQueryData<PaginatedRecipes>(
        recipesKey()
      );
      return { previousRecipes };
    },
  });

  return useMutation<Recipe, Error, UpdateRecipeInput & { id: number }, { previousRecipes?: PaginatedRecipes; previousRecipe?: Recipe }>({
    mutationFn: async (data: UpdateRecipeInput & { id: number }) => {
      if (!data.id)
        throw new ValidationError("Recipe ID is required for update");

      // Convert UpdateRecipeInput to UpdatedRecipe format
      const { id, ...updateFields } = data;
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
    onMutate: async (variables: UpdateRecipeInput & { id: number }) => {
      // Capture previousRecipes BEFORE helper's onMutate (which will update it)
      const previousRecipes = queryClient.getQueryData<PaginatedRecipes>(
        recipesKey()
      );

      // Use the helper's onMutate for recipes list, then handle single recipe query
      const helperContext = await updateOptimisticHelpers.onMutate?.(variables);

      // Cancel and update single recipe query
      await queryClient.cancelQueries({
        queryKey: recipeKey(variables.id),
      });

      const previousRecipe = queryClient.getQueryData<Recipe>(
        recipeKey(variables.id)
      );

      // Update single recipe query
      if (previousRecipe) {
        queryClient.setQueryData<Recipe>(
          recipeKey(variables.id),
          { ...previousRecipe, ...variables }
        );
      }

      // Merge contexts: helper's context has previousRecipes from getContext,
      // but we captured it before the update, so use ours
      return {
        ...helperContext,
        previousRecipes, // Use the one we captured before update
        previousRecipe,
      };
    },
    onError: (
      error: Error,
      variables: UpdateRecipeInput & { id: number },
      context
    ) => {
      // Rollback recipes list manually (helper's rollback won't work for multi-query without previousData)
      const ctx = context as {
        previousRecipes?: PaginatedRecipes;
        previousRecipe?: Recipe;
      };
      if (ctx?.previousRecipes) {
        queryClient.setQueriesData({ queryKey: recipesKey() }, ctx.previousRecipes);
      }

      // Rollback single recipe query
      if (ctx?.previousRecipe) {
        queryClient.setQueryData(
          recipeKey(variables.id),
          ctx.previousRecipe
        );
      }
      toast.error("Failed to update recipe");
    },
    onSettled: async (
      data,
      error,
      variables: UpdateRecipeInput & { id: number },
      context
    ) => {
      // Invalidate recipes list (helper's onSettled would do this but has type mismatch)
      await queryClient.invalidateQueries({ queryKey: recipesKey() });

      // Invalidate single recipe query
      await queryClient.invalidateQueries({
        queryKey: recipeKey(variables.id),
      });
    },
    onSuccess: (data) => {
      toast("Recipe updated successfully!");
      if (!options?.disableNavigation && options?.onSuccessNavigate) {
        options.onSuccessNavigate();
      } else if (!options?.disableNavigation) {
        // Default navigation for update: go back after delay
        setTimeout(() => router.back(), 1500);
      }
    },
  });
}
