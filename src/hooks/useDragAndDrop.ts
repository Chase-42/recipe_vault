"use client";

import { useCallback, useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { logger } from "~/lib/logger";
import type { Recipe, PlannedMeal, MealType, WeeklyMealPlan } from "~/types";
import { mealPlannerApi } from "~/utils/api/meal-planner-client";
import { currentWeekMealsKey } from "~/utils/query-keys";

// Drag and drop state types
export interface DragState {
  draggedRecipe: Recipe | null;
  dragOverSlot: { date: string; mealType: MealType } | null;
  isDragging: boolean;
}

// Custom hook for drag and drop state management
export function useDragAndDrop(weekStart: Date) {
  const queryClient = useQueryClient();
  const [dragState, setDragState] = useState<DragState>({
    draggedRecipe: null,
    dragOverSlot: null,
    isDragging: false,
  });

  // Query key for current week meals - memoized to prevent unnecessary re-renders
  const currentWeekQueryKey = useMemo(
    () => currentWeekMealsKey(weekStart),
    [weekStart]
  );

  // Optimistic update helper for WeeklyMealPlan
  const updateCurrentWeekOptimistically = useCallback(
    (updater: (oldData: WeeklyMealPlan) => WeeklyMealPlan) => {
      queryClient.setQueryData(
        currentWeekQueryKey,
        (oldData: WeeklyMealPlan = {}) => {
          return updater(oldData);
        }
      );
    },
    [queryClient, currentWeekQueryKey]
  );

  // Rollback helper for failed operations
  const rollbackOptimisticUpdate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: currentWeekQueryKey });
  }, [queryClient, currentWeekQueryKey]);

  // Add meal mutation with optimistic updates
  const addMealMutation = useMutation({
    mutationFn: ({
      recipeId,
      date,
      mealType,
    }: {
      recipeId: number;
      date: string;
      mealType: MealType;
    }) => mealPlannerApi.addMealToWeek({ recipeId, date, mealType }),
    onMutate: async ({ recipeId, date, mealType }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: currentWeekQueryKey });

      // Snapshot the previous value
      const previousMeals =
        queryClient.getQueryData<WeeklyMealPlan>(currentWeekQueryKey);

      // Get the recipe from recipes query
      const recipesData =
        queryClient.getQueryData<{ recipes: Recipe[]; pagination: unknown }>(["recipes"]);
      const recipes = recipesData?.recipes ?? [];
      const recipe = recipes.find((r) => r.id === recipeId);

      if (recipe) {
        // Optimistically add the meal
        const optimisticMeal: PlannedMeal = {
          id: -Date.now(), // Temporary negative ID
          userId: "current",
          recipeId,
          date,
          mealType,
          createdAt: new Date().toISOString(),
          recipe,
        };

        updateCurrentWeekOptimistically((oldMeals) => ({
          ...oldMeals,
          [date]: {
            ...oldMeals[date],
            [mealType]: optimisticMeal,
          },
        }));
      }

      // Return context for rollback
      return { previousMeals };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousMeals) {
        queryClient.setQueryData(currentWeekQueryKey, context.previousMeals);
      } else {
        rollbackOptimisticUpdate();
      }

      logger.error(
        "Failed to add meal to plan",
        error instanceof Error ? error : new Error(String(error)),
        {
          recipeId: variables.recipeId,
        }
      );
      toast.error("Failed to add meal to your plan");
    },
    onSuccess: (newMeal) => {
      // Update with the real meal data from server
      updateCurrentWeekOptimistically((oldMeals) => ({
        ...oldMeals,
        [newMeal.date]: {
          ...oldMeals[newMeal.date],
          [newMeal.mealType]: newMeal,
        },
      }));

      toast.success("Meal added to your plan!");
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      void queryClient.invalidateQueries({ queryKey: currentWeekQueryKey });
      void queryClient.invalidateQueries({
        queryKey: ["generatedShoppingList"],
      });
    },
  });

  // Remove meal mutation with optimistic updates
  const removeMealMutation = useMutation({
    mutationFn: ({ date, mealType }: { date: string; mealType: MealType }) =>
      mealPlannerApi.removeMealFromWeek({ date, mealType }),
    onMutate: async ({ date, mealType }) => {
      await queryClient.cancelQueries({ queryKey: currentWeekQueryKey });

      const previousMeals =
        queryClient.getQueryData<WeeklyMealPlan>(currentWeekQueryKey);

      // Optimistically remove the meal
      updateCurrentWeekOptimistically((oldMeals) => {
        const newMeals = { ...oldMeals };
        if (newMeals[date]) {
          const dayMeals = { ...newMeals[date] };
          delete dayMeals[mealType];
          newMeals[date] = dayMeals;
        }
        return newMeals;
      });

      return { previousMeals };
    },
    onError: (error, variables, context) => {
      if (context?.previousMeals) {
        queryClient.setQueryData(currentWeekQueryKey, context.previousMeals);
      } else {
        rollbackOptimisticUpdate();
      }

      logger.error(
        "Failed to remove meal from plan",
        error instanceof Error ? error : new Error(String(error)),
        { date: variables.date, mealType: variables.mealType }
      );
      toast.error("Failed to remove meal from your plan");
    },
    onSuccess: () => {
      toast.success("Meal removed from your plan!");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: currentWeekQueryKey });
      void queryClient.invalidateQueries({
        queryKey: ["generatedShoppingList"],
      });
    },
  });

  // Move meal mutation with optimistic updates
  const moveMealMutation = useMutation({
    mutationFn: ({
      mealId,
      newDate,
      newMealType,
    }: {
      mealId: number;
      newDate: string;
      newMealType: MealType;
    }) =>
      mealPlannerApi.moveMealInWeek({
        mealId,
        newDate,
        newMealType,
      }),
    onMutate: async ({ mealId, newDate, newMealType }) => {
      await queryClient.cancelQueries({ queryKey: currentWeekQueryKey });

      const previousMeals =
        queryClient.getQueryData<WeeklyMealPlan>(currentWeekQueryKey);

      // Find the meal to move
      let mealToMove: PlannedMeal | undefined;
      let oldDate: string | undefined;
      let oldMealType: MealType | undefined;

      for (const [date, dayMeals] of Object.entries(previousMeals || {})) {
        for (const mealType of ["breakfast", "lunch", "dinner"] as MealType[]) {
          const meal = dayMeals[mealType];
          if (meal && meal.id === mealId) {
            mealToMove = meal;
            oldDate = date;
            oldMealType = mealType;
            break;
          }
        }
        if (mealToMove) break;
      }

      if (mealToMove && oldDate && oldMealType) {
        // Optimistically move the meal
        updateCurrentWeekOptimistically((oldMeals) => {
          const newMeals = { ...oldMeals };
          
          // Remove from old location
          if (newMeals[oldDate]) {
            const dayMeals = { ...newMeals[oldDate] };
            delete dayMeals[oldMealType];
            newMeals[oldDate] = dayMeals;
          }
          
          // Add to new location
          if (mealToMove) {
            newMeals[newDate] = {
              ...newMeals[newDate],
              [newMealType]: { ...mealToMove, date: newDate, mealType: newMealType },
            };
          }
          
          return newMeals;
        });
      }

      return { previousMeals };
    },
    onError: (error, variables, context) => {
      if (context?.previousMeals) {
        queryClient.setQueryData(currentWeekQueryKey, context.previousMeals);
      } else {
        rollbackOptimisticUpdate();
      }

      logger.error(
        "Failed to move meal",
        error instanceof Error ? error : new Error(String(error)),
        {
          mealId: variables.mealId,
          newDate: variables.newDate,
          newMealType: variables.newMealType,
        }
      );
      toast.error("Failed to move meal");
    },
    onSuccess: (movedMeal) => {
      // Update with the real meal data from server
      updateCurrentWeekOptimistically((oldMeals) => ({
        ...oldMeals,
        [movedMeal.date]: {
          ...oldMeals[movedMeal.date],
          [movedMeal.mealType]: movedMeal,
        },
      }));

      toast.success("Meal moved successfully!");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: currentWeekQueryKey });
      void queryClient.invalidateQueries({
        queryKey: ["generatedShoppingList"],
      });
    },
  });

  // Drag event handlers
  const handleDragStart = useCallback((recipe: Recipe) => {
    setDragState({
      draggedRecipe: recipe,
      dragOverSlot: null,
      isDragging: true,
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragState({
      draggedRecipe: null,
      dragOverSlot: null,
      isDragging: false,
    });
  }, []);

  const handleDragOver = useCallback((date: string, mealType: MealType) => {
    setDragState((prev) => ({
      ...prev,
      dragOverSlot: { date, mealType },
    }));
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragState((prev) => ({
      ...prev,
      dragOverSlot: null,
    }));
  }, []);

  const handleDrop = useCallback(
    (recipe: Recipe, date: string, mealType: MealType) => {
      // Reset drag state
      setDragState({
        draggedRecipe: null,
        dragOverSlot: null,
        isDragging: false,
      });

      // Add the meal
      addMealMutation.mutate({
        recipeId: recipe.id,
        date,
        mealType,
      });
    },
    [addMealMutation]
  );

  const handleMealRemove = useCallback(
    (plannedMeal: PlannedMeal) => {
      removeMealMutation.mutate({
        date: plannedMeal.date,
        mealType: plannedMeal.mealType,
      });
    },
    [removeMealMutation]
  );

  const handleMealMove = useCallback(
    (meal: PlannedMeal, newDate: string, newMealType: MealType) => {
      moveMealMutation.mutate({
        mealId: meal.id,
        newDate,
        newMealType,
      });
    },
    [moveMealMutation]
  );

  // Helper functions
  const isDraggedRecipe = useCallback(
    (recipeId: number) => dragState.draggedRecipe?.id === recipeId,
    [dragState.draggedRecipe]
  );

  const isDragOverSlot = useCallback(
    (date: string, mealType: MealType) =>
      dragState.dragOverSlot?.date === date &&
      dragState.dragOverSlot?.mealType === mealType,
    [dragState.dragOverSlot]
  );

  const canDropOnSlot = useCallback(
    (_date: string, _mealType: MealType) => {
      // Can always drop if there's a dragged recipe
      return !!dragState.draggedRecipe;
    },
    [dragState.draggedRecipe]
  );

  return {
    // State
    dragState,

    // Mutation states
    isAddingMeal: addMealMutation.isPending,
    isRemovingMeal: removeMealMutation.isPending,
    isMovingMeal: moveMealMutation.isPending,

    // Event handlers
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleMealRemove,
    handleMealMove,

    // Helper functions
    isDraggedRecipe,
    isDragOverSlot,
    canDropOnSlot,

    // Direct mutation access for advanced use cases
    addMealMutation,
    removeMealMutation,
    moveMealMutation,
  };
}

// Hook for managing drag and drop visual feedback
export function useDragVisualFeedback() {
  const [dragFeedback, setDragFeedback] = useState<{
    isDragActive: boolean;
    dragOverElement: string | null;
    canDrop: boolean;
  }>({
    isDragActive: false,
    dragOverElement: null,
    canDrop: false,
  });

  const setDragActive = useCallback((active: boolean) => {
    setDragFeedback((prev) => ({
      ...prev,
      isDragActive: active,
    }));
  }, []);

  const setDragOverElement = useCallback(
    (elementId: string | null, canDrop = true) => {
      setDragFeedback((prev) => ({
        ...prev,
        dragOverElement: elementId,
        canDrop,
      }));
    },
    []
  );

  const resetDragFeedback = useCallback(() => {
    setDragFeedback({
      isDragActive: false,
      dragOverElement: null,
      canDrop: false,
    });
  }, []);

  return {
    dragFeedback,
    setDragActive,
    setDragOverElement,
    resetDragFeedback,
  };
}
