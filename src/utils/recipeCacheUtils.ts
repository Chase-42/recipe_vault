import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { RecipesData, Recipe } from "~/types";

// Helper function to update recipes in the cache
export function updateRecipesInCache(
  queryClient: QueryClient,
  updateFn: (recipes: Recipe[]) => Recipe[],
) {
  queryClient.setQueryData<RecipesData>(["recipes"], (oldData) => {
    if (!oldData) return oldData;

    return {
      ...oldData,
      pages: oldData.pages.map((page) => ({
        ...page,
        recipes: updateFn(page.recipes),
      })),
    };
  });
}

// Helper function to perform a mutation with rollback on error
export async function performMutationWithRollback(
  mutationFn: () => Promise<void>,
  queryClient: QueryClient,
  previousData: RecipesData | undefined,
  successMessage: string,
  errorMessage: string,
) {
  try {
    await mutationFn();
    toast.success(successMessage);
  } catch (error) {
    queryClient.setQueryData(["recipes"], previousData);
    console.error(errorMessage, error);
    toast.error(errorMessage);
  }
}
