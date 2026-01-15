import type { Category, SortOption } from "~/types";

/**
 * Query key factory functions for standardizing React Query keys across the application.
 * This ensures consistency and makes it easier to update query keys in the future.
 */

/**
 * Creates a query key for the current week's meals.
 * @param weekStart - The start date of the week (Monday)
 * @returns Query key array: ["currentWeekMeals", "YYYY-MM-DD"]
 */
export function currentWeekMealsKey(weekStart: Date): [string, string] {
  const dateStr = weekStart.toISOString().split("T")[0];
  if (!dateStr) {
    throw new Error("Invalid date format");
  }
  return ["currentWeekMeals", dateStr];
}

/**
 * Creates a query key for recipes list with optional filters.
 * @param filters - Optional filters for the recipes query
 * @returns Query key array: ["recipes", filters] or ["recipes"] if no filters
 */
export function recipesKey(filters?: {
  searchTerm?: string;
  sortOption?: SortOption;
  category?: Category;
  page?: number;
}): [string] | [string, typeof filters] {
  if (!filters) {
    return ["recipes"];
  }
  return ["recipes", filters];
}

/**
 * Creates a query key for a single recipe.
 * @param id - The recipe ID
 * @returns Query key array: ["recipe", id]
 */
export function recipeKey(id: number): [string, number] {
  return ["recipe", id];
}

/**
 * Query key for saved meal plans.
 */
export const savedMealPlansKey = ["savedMealPlans"] as const;
