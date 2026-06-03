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

interface AddMealParams {
  recipeId: number;
  date: string;
  mealType: MealType;
}

interface RemoveMealParams {
  date: string;
  mealType: MealType;
}

interface MoveMealParams {
  mealId: number;
  newDate: string;
  newMealType: MealType;
}

interface SaveMealPlanParams {
  name: string;
  description?: string;
  weekStart?: string;
}

interface LoadMealPlanParams {
  mealPlanId: number;
}

interface DeleteMealPlanParams {
  mealPlanId: number;
}

interface AddToShoppingListParams {
  ingredients: ProcessedIngredient[];
}

interface AddToShoppingListResponse {
  addedItems: unknown[];
  updatedItems: unknown[];
}

async function throwOnError(response: Response, fallback: string): Promise<void> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || fallback);
  }
}

async function throwOnErrorJson(response: Response, fallback: string): Promise<void> {
  if (!response.ok) {
    let message = fallback;
    try {
      const data = (await response.json()) as { error?: string };
      message = data.error ?? fallback;
    } catch {
      // Use fallback
    }
    throw new Error(message);
  }
}

async function getCurrentWeekMeals(weekStart: Date): Promise<WeeklyMealPlan> {
  const weekStartStr = weekStart.toISOString().split("T")[0];
  const response = await fetch(`/api/meal-planner/current-week?weekStart=${weekStartStr}`);
  await throwOnError(response, "Failed to fetch meals");
  return parseApiResponse<WeeklyMealPlan>(response);
}

async function getRecipes(params?: { limit?: number }): Promise<{ recipes: Recipe[]; pagination: unknown }> {
  const limit = params?.limit ?? 100;
  const response = await fetch(`/api/recipes?limit=${limit}`);
  await throwOnError(response, "Failed to fetch recipes");
  const { data: recipes, pagination } = await parsePaginatedApiResponse<Recipe>(response);
  return { recipes, pagination };
}

async function getSavedMealPlans(): Promise<MealPlan[]> {
  const response = await fetch("/api/meal-planner/plans");
  await throwOnError(response, "Failed to fetch saved plans");
  return parseApiResponse<MealPlan[]>(response);
}

async function addMealToWeek(params: AddMealParams): Promise<PlannedMeal> {
  const response = await fetch("/api/meal-planner/current-week", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  await throwOnError(response, "Failed to add meal");
  return parseApiResponse<PlannedMeal>(response);
}

async function removeMealFromWeek(params: RemoveMealParams): Promise<void> {
  const response = await fetch(
    `/api/meal-planner/current-week?date=${params.date}&mealType=${params.mealType}`,
    { method: "DELETE" }
  );
  await throwOnError(response, "Failed to remove meal");
}

async function moveMealInWeek(params: MoveMealParams): Promise<PlannedMeal> {
  const response = await fetch("/api/meal-planner/current-week", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  await throwOnError(response, "Failed to move meal");
  return parseApiResponse<PlannedMeal>(response);
}

async function saveMealPlan(params: SaveMealPlanParams): Promise<MealPlan> {
  const response = await fetch("/api/meal-planner/plans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  await throwOnError(response, "Failed to save meal plan");

  const data = await parseApiResponse<{ id: number; name: string; description?: string }>(response);
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    userId: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as MealPlan;
}

async function loadMealPlan(params: LoadMealPlanParams): Promise<{ mealPlanId: number }> {
  const response = await fetch("/api/meal-planner/plans", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mealPlanId: params.mealPlanId }),
  });
  await throwOnErrorJson(response, "Failed to load meal plan");
  return parseApiResponse<{ mealPlanId: number }>(response);
}

async function deleteMealPlan(params: DeleteMealPlanParams): Promise<void> {
  const response = await fetch(`/api/meal-planner/plans/${params.mealPlanId}`, { method: "DELETE" });
  await throwOnErrorJson(response, "Failed to delete meal plan");
}

async function generateEnhancedShoppingList(weekStart: Date): Promise<GenerateEnhancedShoppingListResponse> {
  const weekStartStr = weekStart.toISOString().split("T")[0];
  const response = await fetch(`/api/shopping-lists/generate-enhanced?weekStart=${weekStartStr}`);
  await throwOnError(response, "Failed to generate shopping list");
  return parseApiResponse<GenerateEnhancedShoppingListResponse>(response);
}

async function addToShoppingList(params: AddToShoppingListParams): Promise<AddToShoppingListResponse> {
  const response = await fetch("/api/shopping-lists/add-from-meal-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ingredients: params.ingredients }),
  });
  await throwOnErrorJson(response, "Failed to add items to shopping list");
  return parseApiResponse<AddToShoppingListResponse>(response);
}

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
