import type { QueryClient } from "@tanstack/react-query";

// Optimistic update configuration
export interface OptimisticUpdateConfig<TData, TVariables> {
  queryKey: unknown[];
  updater: (oldData: TData | undefined, variables: TVariables) => TData;
  rollback?: (oldData: TData | undefined, variables: TVariables) => TData;
}

// Performs an optimistic update with automatic rollback on error
export async function performOptimisticUpdate<
  TData,
  TVariables,
  TMutationResult = unknown,
>(
  queryClient: QueryClient,
  config: OptimisticUpdateConfig<TData, TVariables>,
  variables: TVariables,
  mutationFn: (variables: TVariables) => Promise<TMutationResult>
): Promise<{ success: boolean; data?: TMutationResult; error?: unknown }> {
  // Cancel outgoing refetches
  await queryClient.cancelQueries({ queryKey: config.queryKey });

  // Snapshot the previous value
  const previousData = queryClient.getQueryData<TData>(config.queryKey);

  try {
    // Optimistically update
    queryClient.setQueryData(config.queryKey, (oldData: TData | undefined) =>
      config.updater(oldData, variables)
    );

    // Perform the actual mutation
    const result = await mutationFn(variables);

    return { success: true, data: result };
  } catch (error) {
    // Rollback on error
    if (config.rollback) {
      const rollbackFn = config.rollback;
      queryClient.setQueryData(config.queryKey, (oldData: TData | undefined) =>
        rollbackFn(oldData, variables)
      );
    } else {
      // Default rollback to previous data
      queryClient.setQueryData(config.queryKey, previousData);
    }

    return { success: false, error };
  } finally {
    // Always refetch to ensure consistency
    void queryClient.invalidateQueries({ queryKey: config.queryKey });
  }
}

// Creates an optimistic update handler for a specific query
export function createOptimisticUpdater<
  TData,
  TVariables,
  TMutationResult = unknown,
>(queryClient: QueryClient, config: OptimisticUpdateConfig<TData, TVariables>) {
  return async (
    variables: TVariables,
    mutationFn: (variables: TVariables) => Promise<TMutationResult>
  ) => {
    return performOptimisticUpdate<TData, TVariables, TMutationResult>(
      queryClient,
      config,
      variables,
      mutationFn
    );
  };
}
