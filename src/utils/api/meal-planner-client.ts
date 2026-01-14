/**
 * Meal Planner API Client
 * 
 * Centralized API client for meal planner operations.
 * Provides type-safe methods for all meal planner API calls.
 */

import { parseApiResponse, parsePaginatedApiResponse } from "../api-client";
import type {
  WeeklyMealPlan,
  PlannedMeal,
  MealPlan,
  Recipe,
  MealType,
  GenerateEnhancedShoppingListResponse,
  ProcessedIngredient,
} from "~/types";

export interface AddMealParams {
  recipeId: number;
  date: string;
  mealType: MealType;
}

export interface RemoveMealParams {
  date: string;
  mealType: MealType;
}

export interface MoveMealParams {
  mealId: number;
  newDate: string;
  newMealType: MealType;
}

export interface SaveMealPlanParams {
  name: string;
  description?: string;
  weekStart?: string; // Optional: ISO date string (YYYY-MM-DD)
}

export interface LoadMealPlanParams {
  mealPlanId: number;
}

export interface DeleteMealPlanParams {
  mealPlanId: number;
}

export interface AddToShoppingListParams {
  ingredients: ProcessedIngredient[];
}

export interface AddToShoppingListResponse {
  addedItems: unknown[];
  updatedItems: unknown[];
}

/**
 * Get current week meals
 */
export async function getCurrentWeekMeals(
  weekStart: Date
): Promise<WeeklyMealPlan> {
  const weekStartStr = weekStart.toISOString().split("T")[0];
  const response = await fetch(
    `/api/meal-planner/current-week?weekStart=${weekStartStr}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to fetch meals");
  }

  return parseApiResponse<WeeklyMealPlan>(response);
}

/**
 * Get available recipes
 */
export async function getRecipes(params?: {
  limit?: number;
}): Promise<{ recipes: Recipe[]; pagination: unknown }> {
  const limit = params?.limit ?? 100;
  const response = await fetch(`/api/recipes?limit=${limit}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to fetch recipes");
  }

  const { data: recipes, pagination } =
    await parsePaginatedApiResponse<Recipe>(response);
  return { recipes, pagination };
}

/**
 * Get saved meal plans
 */
export async function getSavedMealPlans(): Promise<MealPlan[]> {
  const response = await fetch("/api/meal-planner/plans");

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to fetch saved plans");
  }

  return parseApiResponse<MealPlan[]>(response);
}

/**
 * Add a meal to the current week
 */
export async function addMealToWeek(
  params: AddMealParams
): Promise<PlannedMeal> {
  const response = await fetch("/api/meal-planner/current-week", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to add meal");
  }

  return parseApiResponse<PlannedMeal>(response);
}

/**
 * Remove a meal from the current week
 */
export async function removeMealFromWeek(
  params: RemoveMealParams
): Promise<void> {
  const response = await fetch(
    `/api/meal-planner/current-week?date=${params.date}&mealType=${params.mealType}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to remove meal");
  }
}

/**
 * Move a meal within the current week
 */
export async function moveMealInWeek(
  params: MoveMealParams
): Promise<PlannedMeal> {
  const response = await fetch("/api/meal-planner/current-week", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to move meal");
  }

  return parseApiResponse<PlannedMeal>(response);
}

/**
 * Save a meal plan
 */
export async function saveMealPlan(
  params: SaveMealPlanParams
): Promise<MealPlan> {
  const response = await fetch("/api/meal-planner/plans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to save meal plan");
  }

  const data = await parseApiResponse<{
    id: number;
    name: string;
    description?: string;
  }>(response);

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    userId: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as MealPlan;
}

/**
 * Load a meal plan into the current week
 */
export async function loadMealPlan(
  params: LoadMealPlanParams
): Promise<{ mealPlanId: number }> {
  const response = await fetch("/api/meal-planner/plans", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mealPlanId: params.mealPlanId }),
  });

  if (!response.ok) {
    let errorMessage = "Failed to load meal plan";
    try {
      const errorData = (await response.json()) as { error?: string };
      errorMessage = errorData.error ?? errorMessage;
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }

  return parseApiResponse<{ mealPlanId: number }>(response);
}

/**
 * Delete a meal plan
 */
export async function deleteMealPlan(
  params: DeleteMealPlanParams
): Promise<void> {
  const response = await fetch(`/api/meal-planner/plans/${params.mealPlanId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    let errorMessage = "Failed to delete meal plan";
    try {
      const errorData = (await response.json()) as { error?: string };
      errorMessage = errorData.error ?? errorMessage;
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }
}

/**
 * Generate enhanced shopping list for a week
 */
export async function generateEnhancedShoppingList(
  weekStart: Date
): Promise<GenerateEnhancedShoppingListResponse> {
  const weekStartStr = weekStart.toISOString().split("T")[0];
  const response = await fetch(
    `/api/shopping-lists/generate-enhanced?weekStart=${weekStartStr}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to generate shopping list");
  }

  return parseApiResponse<GenerateEnhancedShoppingListResponse>(response);
}

/**
 * Add ingredients from meal plan to shopping list
 */
export async function addToShoppingList(
  params: AddToShoppingListParams
): Promise<AddToShoppingListResponse> {
  const response = await fetch("/api/shopping-lists/add-from-meal-plan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ingredients: params.ingredients }),
  });

  if (!response.ok) {
    let errorMessage = "Failed to add items to shopping list";
    try {
      const errorData = (await response.json()) as { error?: string };
      errorMessage = errorData.error ?? errorMessage;
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }

  return parseApiResponse<AddToShoppingListResponse>(response);
}

/**
 * Meal Planner API Client
 * 
 * Centralized client for all meal planner operations.
 * All meal planner API calls should go through this client to ensure consistency.
 */
export const mealPlannerApi = {
  getCurrentWeekMeals,
  getRecipes,
  getSavedMealPlans,
  addMealToWeek,
  removeMealFromWeek,
  moveMealInWeek,
  saveMealPlan,
  loadMealPlan,
  deleteMealPlan,
  generateEnhancedShoppingList,
  addToShoppingList,
};
