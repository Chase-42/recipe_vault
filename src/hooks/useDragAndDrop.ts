"use client";

import { useCallback, useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Recipe, PlannedMeal, MealType } from "../types";

// Drag and drop state types
export interface DragState {
  draggedRecipe: Recipe | null;
  dragOverSlot: { date: string; mealType: MealType } | null;
  isDragging: boolean;
}

// API functions for meal operations (these will be implemented when API endpoints are ready)
async function addMealToWeekAPI(
  recipeId: number,
  date: string,
  mealType: MealType
): Promise<PlannedMeal> {
  const response = await fetch("/api/meal-planner/current-week", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipeId,
      date,
      mealType,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to add meal");
  }

  return response.json() as Promise<PlannedMeal>;
}

async function removeMealFromWeekAPI(date: string, mealType: MealType): Promise<void> {
  const params = new URLSearchParams({ date, mealType });
  const response = await fetch(`/api/meal-planner/current-week?${params}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to remove meal");
  }
}

async function moveMealInWeekAPI(
  mealId: number,
  newDate: string,
  newMealType: MealType
): Promise<PlannedMeal> {
  const response = await fetch(`/api/meal-planner/current-week`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mealId,
      newDate,
      newMealType,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to move meal");
  }

  return response.json() as Promise<PlannedMeal>;
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
  const currentWeekQueryKey = useMemo(() => [
    "currentWeekMeals",
    weekStart.toISOString().split("T")[0],
  ], [weekStart]);

  // Optimistic update helper
  const updateCurrentWeekOptimistically = useCallback(
    (updater: (oldData: PlannedMeal[]) => PlannedMeal[]) => {
      queryClient.setQueryData(currentWeekQueryKey, (oldData: PlannedMeal[] = []) => {
        return updater(oldData);
      });
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
    }) => addMealToWeekAPI(recipeId, date, mealType),
    onMutate: async ({ recipeId, date, mealType }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: currentWeekQueryKey });

      // Snapshot the previous value
      const previousMeals = queryClient.getQueryData<PlannedMeal[]>(currentWeekQueryKey);

      // Get the recipe from available recipes query
      const availableRecipes = queryClient.getQueryData<Recipe[]>(["availableRecipes"]) ?? [];
      const recipe = availableRecipes.find((r) => r.id === recipeId);

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

        updateCurrentWeekOptimistically((oldMeals) => {
          // Remove any existing meal in the same slot
          const filteredMeals = oldMeals.filter(
            (meal) => !(meal.date === date && meal.mealType === mealType)
          );
          return [...filteredMeals, optimisticMeal];
        });
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

      console.error("Failed to add meal:", error);
      toast.error("Failed to add meal to your plan");
    },
    onSuccess: (newMeal) => {
      // Update with the real meal data from server
      updateCurrentWeekOptimistically((oldMeals) => {
        // Remove the optimistic meal and add the real one
        const filteredMeals = oldMeals.filter(
          (meal) => !(meal.date === newMeal.date && meal.mealType === newMeal.mealType)
        );
        return [...filteredMeals, newMeal];
      });

      toast.success("Meal added to your plan!");
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      void queryClient.invalidateQueries({ queryKey: currentWeekQueryKey });
      void queryClient.invalidateQueries({ queryKey: ["generatedShoppingList"] });
    },
  });

  // Remove meal mutation with optimistic updates
  const removeMealMutation = useMutation({
    mutationFn: ({ date, mealType }: { date: string; mealType: MealType }) => 
      removeMealFromWeekAPI(date, mealType),
    onMutate: async ({ date, mealType }) => {
      await queryClient.cancelQueries({ queryKey: currentWeekQueryKey });

      const previousMeals = queryClient.getQueryData<PlannedMeal[]>(currentWeekQueryKey);

      // Optimistically remove the meal
      updateCurrentWeekOptimistically((oldMeals) =>
        oldMeals.filter((meal) => !(meal.date === date && meal.mealType === mealType))
      );

      return { previousMeals };
    },
    onError: (error, variables, context) => {
      if (context?.previousMeals) {
        queryClient.setQueryData(currentWeekQueryKey, context.previousMeals);
      } else {
        rollbackOptimisticUpdate();
      }

      console.error("Failed to remove meal:", error);
      toast.error("Failed to remove meal from your plan");
    },
    onSuccess: () => {
      toast.success("Meal removed from your plan!");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: currentWeekQueryKey });
      void queryClient.invalidateQueries({ queryKey: ["generatedShoppingList"] });
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
    }) => moveMealInWeekAPI(mealId, newDate, newMealType),
    onMutate: async ({ mealId, newDate, newMealType }) => {
      await queryClient.cancelQueries({ queryKey: currentWeekQueryKey });

      const previousMeals = queryClient.getQueryData<PlannedMeal[]>(currentWeekQueryKey);

      // Optimistically move the meal
      updateCurrentWeekOptimistically((oldMeals) =>
        oldMeals.map((meal) =>
          meal.id === mealId
            ? { ...meal, date: newDate, mealType: newMealType }
            : meal
        )
      );

      return { previousMeals };
    },
    onError: (error, variables, context) => {
      if (context?.previousMeals) {
        queryClient.setQueryData(currentWeekQueryKey, context.previousMeals);
      } else {
        rollbackOptimisticUpdate();
      }

      console.error("Failed to move meal:", error);
      toast.error("Failed to move meal");
    },
    onSuccess: () => {
      toast.success("Meal moved successfully!");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: currentWeekQueryKey });
      void queryClient.invalidateQueries({ queryKey: ["generatedShoppingList"] });
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

  const setDragOverElement = useCallback((elementId: string | null, canDrop = true) => {
    setDragFeedback((prev) => ({
      ...prev,
      dragOverElement: elementId,
      canDrop,
    }));
  }, []);

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