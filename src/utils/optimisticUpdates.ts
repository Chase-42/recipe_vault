import type {
  QueryClient,
  MutationOptions,
  UseMutationOptions,
} from "@tanstack/react-query";

// Optimistic update configuration for single query
export interface OptimisticUpdateConfig<TData, TVariables> {
  queryKey: unknown[];
  updater: (oldData: TData | undefined, variables: TVariables) => TData;
  rollback?: (oldData: TData | undefined, variables: TVariables) => TData;
}

// Optimistic update configuration for multiple queries (setQueriesData)
export interface OptimisticMultiUpdateConfig<TData, TVariables> {
  queryKey: unknown[];
  updater: (oldData: TData | undefined, variables: TVariables) => TData | undefined;
  rollback?: (oldData: TData | undefined, variables: TVariables) => TData | undefined;
}

// Combined configuration for mutations that update multiple queries
export interface OptimisticMutationConfig<TData, TVariables, TContext = unknown> {
  // Single query update
  singleQuery?: OptimisticUpdateConfig<TData, TVariables>;
  // Multiple queries update (setQueriesData)
  multiQuery?: OptimisticMultiUpdateConfig<TData, TVariables>;
  // Additional query keys to cancel
  cancelQueries?: unknown[][];
  // Context to return from onMutate (for rollback)
  getContext?: (variables: TVariables, previousData?: TData) => TContext;
  // Invalidation keys (defaults to singleQuery.queryKey if not provided)
  invalidateQueries?: unknown[][];
}

// Context returned from onMutate for rollback
export interface OptimisticContext<TData, TContext = unknown> {
  previousData?: TData;
  context?: TContext;
}

/**
 * Creates React Query mutation options with optimistic updates
 * Returns onMutate, onError, and onSettled handlers that can be spread into useMutation
 */
export function createOptimisticMutation<
  TData,
  TVariables,
  TError = Error,
  TContext = unknown,
>(
  queryClient: QueryClient,
  config: OptimisticMutationConfig<TData, TVariables, TContext>
): Pick<
  UseMutationOptions<TData, TError, TVariables, TContext>,
  "onMutate" | "onError" | "onSettled"
> {
  return {
    onMutate: async (variables: TVariables) => {
      // Cancel all specified queries
      const queriesToCancel = [
        ...(config.singleQuery ? [config.singleQuery.queryKey] : []),
        ...(config.multiQuery ? [config.multiQuery.queryKey] : []),
        ...(config.cancelQueries || []),
      ];

      await Promise.all(
        queriesToCancel.map((key) =>
          queryClient.cancelQueries({ queryKey: key })
        )
      );

      // Snapshot previous data for rollback
      const previousData = config.singleQuery
        ? queryClient.getQueryData<TData>(config.singleQuery.queryKey)
        : undefined;

      // Apply single query update
      if (config.singleQuery) {
        const singleQuery = config.singleQuery;
        queryClient.setQueryData<TData>(
          singleQuery.queryKey,
          (oldData) => singleQuery.updater(oldData, variables)
        );
      }

      // Apply multi-query update
      if (config.multiQuery) {
        const multiQuery = config.multiQuery;
        queryClient.setQueriesData<TData>(
          { queryKey: multiQuery.queryKey },
          (oldData) => multiQuery.updater(oldData, variables)
        );
      }

      // Build context for rollback
      const context: OptimisticContext<TData, TContext> = {
        previousData,
        context: config.getContext
          ? config.getContext(variables, previousData)
          : undefined,
      };

      return context as TContext;
    },

    onError: (error: TError, variables: TVariables, context) => {
      const optimisticContext = context as OptimisticContext<TData, TContext> | undefined;

      // Rollback single query
      if (config.singleQuery && optimisticContext?.previousData !== undefined) {
        const singleQuery = config.singleQuery;
        if (singleQuery.rollback) {
          const rollbackFn = singleQuery.rollback;
          queryClient.setQueryData<TData>(
            singleQuery.queryKey,
            (oldData) => rollbackFn(oldData, variables)
          );
        } else {
          queryClient.setQueryData(
            singleQuery.queryKey,
            optimisticContext.previousData
          );
        }
      }

      // Rollback multi-query
      if (config.multiQuery) {
        const multiQuery = config.multiQuery;
        if (multiQuery.rollback) {
          const rollbackFn = multiQuery.rollback;
          queryClient.setQueriesData<TData>(
            { queryKey: multiQuery.queryKey },
            (oldData) => rollbackFn(oldData, variables)
          );
        } else if (optimisticContext?.previousData !== undefined) {
          // Default rollback: restore previous data to all matching queries
          queryClient.setQueriesData(
            { queryKey: multiQuery.queryKey },
            optimisticContext.previousData
          );
        }
      }
    },

    onSettled: async () => {
      // Invalidate queries to sync with server
      const queriesToInvalidate = [
        ...(config.invalidateQueries || []),
        ...(config.singleQuery ? [config.singleQuery.queryKey] : []),
        ...(config.multiQuery ? [config.multiQuery.queryKey] : []),
      ];

      await Promise.all(
        queriesToInvalidate.map((key) =>
          queryClient.invalidateQueries({ queryKey: key })
        )
      );
    },
  };
}

/**
 * Helper to create an updater function for list operations (add, remove, update item)
 */
export function createListUpdater<TItem, TVariables>(
  predicate: (item: TItem, variables: TVariables) => boolean,
  updater: (item: TItem, variables: TVariables) => TItem | null
) {
  return (oldList: TItem[] | undefined, variables: TVariables): TItem[] => {
    if (!oldList) return oldList ?? [];
    return oldList
      .map((item) => (predicate(item, variables) ? updater(item, variables) : item))
      .filter((item): item is TItem => item !== null);
  };
}

/**
 * Helper to create an updater function for single item updates
 */
export function createItemUpdater<TItem, TVariables>(
  predicate: (item: TItem, variables: TVariables) => boolean,
  updater: (item: TItem, variables: TVariables) => TItem
) {
  return (oldItem: TItem | undefined, variables: TVariables): TItem | undefined => {
    if (!oldItem) return oldItem;
    if (!predicate(oldItem, variables)) return oldItem;
    return updater(oldItem, variables);
  };
}

// Legacy functions (kept for backward compatibility)
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
