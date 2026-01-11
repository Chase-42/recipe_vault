import { useState, useEffect, useCallback } from "react";

interface RecipeProgress {
  checkedIngredients: number[];
  checkedInstructions: number[];
}

const STORAGE_KEY_PREFIX = "recipe_progress_";

/**
 * Hook to persist and restore checked ingredients and instructions for a recipe
 * Uses localStorage to persist progress across page refreshes
 */
export function useRecipeProgress(recipeId: number) {
  const storageKey = `${STORAGE_KEY_PREFIX}${recipeId}`;

  // Load from localStorage on mount
  const loadProgress = useCallback((): RecipeProgress => {
    if (typeof window === "undefined") {
      return { checkedIngredients: [], checkedInstructions: [] };
    }

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as RecipeProgress;
        return {
          checkedIngredients: parsed.checkedIngredients ?? [],
          checkedInstructions: parsed.checkedInstructions ?? [],
        };
      }
    } catch (error) {
      console.error("Failed to load recipe progress from localStorage:", error);
    }

    return { checkedIngredients: [], checkedInstructions: [] };
  }, [storageKey]);

  // Initialize state from localStorage
  const [progress, setProgress] = useState<RecipeProgress>(() => loadProgress());

  // Save to localStorage whenever progress changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch (error) {
      console.error("Failed to save recipe progress to localStorage:", error);
      // Handle quota exceeded error gracefully
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        console.warn("localStorage quota exceeded, clearing old progress data");
        // Optionally: clear old entries or notify user
      }
    }
  }, [progress, storageKey]);

  // Convert arrays to Sets for easier manipulation
  const checkedIngredients = new Set(progress.checkedIngredients);
  const checkedInstructions = new Set(progress.checkedInstructions);

  const setCheckedIngredients = useCallback((ingredients: Set<number>) => {
    setProgress((prev) => ({
      ...prev,
      checkedIngredients: Array.from(ingredients),
    }));
  }, []);

  const setCheckedInstructions = useCallback((instructions: Set<number>) => {
    setProgress((prev) => ({
      ...prev,
      checkedInstructions: Array.from(instructions),
    }));
  }, []);

  // Clear progress for this recipe
  const clearProgress = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(storageKey);
      setProgress({ checkedIngredients: [], checkedInstructions: [] });
    } catch (error) {
      console.error("Failed to clear recipe progress:", error);
    }
  }, [storageKey]);

  return {
    checkedIngredients,
    checkedInstructions,
    setCheckedIngredients,
    setCheckedInstructions,
    clearProgress,
  };
}
