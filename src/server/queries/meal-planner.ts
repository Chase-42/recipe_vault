import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
import { db } from "~/server/db";
import {
  plannedMeals,
  mealPlans,
  currentWeekMeals,
  recipes,
} from "~/server/db/schema";
import type { WeeklyMealPlan, PlannedMeal, MealType } from "~/types";

// Helper function to get week date range
function getWeekDateRange(weekStart: Date): {
  startDate: string;
  endDate: string;
} {
  const start = new Date(weekStart);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);

  const startDateParts = start.toISOString().split("T");
  const endDateParts = end.toISOString().split("T");

  const startDate = startDateParts[0];
  const endDate = endDateParts[0];

  if (!startDate || !endDate) {
    throw new Error("Invalid date range");
  }

  return { startDate, endDate };
}

// Get current week meals for a user
export async function getCurrentWeekMeals(
  userId: string,
  weekStart: Date
): Promise<WeeklyMealPlan> {
  const { startDate, endDate } = getWeekDateRange(weekStart);

  const meals = await db
    .select({
      id: currentWeekMeals.id,
      userId: currentWeekMeals.userId,
      recipeId: currentWeekMeals.recipeId,
      date: currentWeekMeals.date,
      mealType: currentWeekMeals.mealType,
      createdAt: currentWeekMeals.createdAt,
      recipe: {
        id: recipes.id,
        name: recipes.name,
        imageUrl: recipes.imageUrl,
        blurDataUrl: recipes.blurDataUrl,
        instructions: recipes.instructions,
        ingredients: recipes.ingredients,
        favorite: recipes.favorite,
        categories: recipes.categories,
        tags: recipes.tags,
        link: recipes.link,
        createdAt: recipes.createdAt,
      },
    })
    .from(currentWeekMeals)
    .innerJoin(recipes, eq(currentWeekMeals.recipeId, recipes.id))
    .where(
      and(
        eq(currentWeekMeals.userId, userId),
        gte(currentWeekMeals.date, startDate),
        lte(currentWeekMeals.date, endDate)
      )
    )
    .orderBy(asc(currentWeekMeals.date), asc(currentWeekMeals.mealType));

  // Convert to WeeklyMealPlan format
  const weeklyPlan: WeeklyMealPlan = {};

  for (const meal of meals) {
    if (!weeklyPlan[meal.date]) {
      weeklyPlan[meal.date] = {};
    }

    const plannedMeal: PlannedMeal = {
      id: meal.id,
      userId: meal.userId,
      recipeId: meal.recipeId,
      mealPlanId: undefined, // Current week meals don't have a meal plan ID
      date: meal.date,
      mealType: meal.mealType as MealType,
      createdAt: meal.createdAt.toISOString(),
      recipe: {
        ...meal.recipe,
        createdAt: meal.recipe.createdAt.toISOString(),
      },
    };

    (weeklyPlan[meal.date] as Record<MealType, PlannedMeal>)[
      meal.mealType as MealType
    ] = plannedMeal;
  }

  return weeklyPlan;
}

// Add a meal to the current week
export async function addMealToWeek(
  userId: string,
  recipeId: number,
  date: string,
  mealType: MealType
): Promise<PlannedMeal> {
  // Wrap delete and insert in transaction to ensure atomicity
  const meal = await db.transaction(async (tx) => {
    // Remove any existing meal for this slot
    await tx
      .delete(currentWeekMeals)
      .where(
        and(
          eq(currentWeekMeals.userId, userId),
          eq(currentWeekMeals.date, date),
          eq(currentWeekMeals.mealType, mealType)
        )
      );

    // Add new meal
    const [newMeal] = await tx
      .insert(currentWeekMeals)
      .values({
        userId,
        recipeId,
        date,
        mealType,
      })
      .returning();

    if (!newMeal) {
      throw new Error("Failed to add meal to week");
    }

    return newMeal;
  });

  // Fetch recipe data for the planned meal
  const [mealWithRecipe] = await db
    .select({
      id: currentWeekMeals.id,
      userId: currentWeekMeals.userId,
      recipeId: currentWeekMeals.recipeId,
      date: currentWeekMeals.date,
      mealType: currentWeekMeals.mealType,
      createdAt: currentWeekMeals.createdAt,
      recipe: {
        id: recipes.id,
        name: recipes.name,
        imageUrl: recipes.imageUrl,
        blurDataUrl: recipes.blurDataUrl,
        instructions: recipes.instructions,
        ingredients: recipes.ingredients,
        favorite: recipes.favorite,
        categories: recipes.categories,
        tags: recipes.tags,
        link: recipes.link,
        createdAt: recipes.createdAt,
      },
    })
    .from(currentWeekMeals)
    .innerJoin(recipes, eq(currentWeekMeals.recipeId, recipes.id))
    .where(eq(currentWeekMeals.id, meal.id))
    .limit(1);

  if (!mealWithRecipe) {
    throw new Error("Failed to fetch meal with recipe data");
  }

  // Convert to PlannedMeal format
  return {
    id: mealWithRecipe.id,
    userId: mealWithRecipe.userId,
    recipeId: mealWithRecipe.recipeId,
    mealPlanId: undefined, // Current week meals don't have a meal plan ID
    date: mealWithRecipe.date,
    mealType: mealWithRecipe.mealType as MealType,
    createdAt: mealWithRecipe.createdAt.toISOString(),
    recipe: {
      ...mealWithRecipe.recipe,
      createdAt: mealWithRecipe.recipe.createdAt.toISOString(),
    },
  };
}

// Remove a meal from the current week
export async function removeMealFromWeek(
  userId: string,
  date: string,
  mealType: MealType
): Promise<void> {
  await db
    .delete(currentWeekMeals)
    .where(
      and(
        eq(currentWeekMeals.userId, userId),
        eq(currentWeekMeals.date, date),
        eq(currentWeekMeals.mealType, mealType)
      )
    );
}

// Move a meal to a different date/time slot
export async function moveMealInWeek(
  userId: string,
  mealId: number,
  newDate: string,
  newMealType: MealType
): Promise<PlannedMeal> {
  const [meal] = await db
    .update(currentWeekMeals)
    .set({
      date: newDate,
      mealType: newMealType,
    })
    .where(
      and(eq(currentWeekMeals.id, mealId), eq(currentWeekMeals.userId, userId))
    )
    .returning();

  if (!meal) {
    throw new Error("Failed to move meal");
  }

  return {
    id: meal.id,
    userId: meal.userId,
    recipeId: meal.recipeId,
    mealPlanId: undefined, // Current week meals don't have a meal plan ID
    date: meal.date,
    mealType: meal.mealType as MealType,
    createdAt: meal.createdAt.toISOString(),
  };
}

// Save current week as a named meal plan
export async function saveCurrentWeekAsPlan(
  userId: string,
  name: string,
  description?: string,
  weekStart?: Date
): Promise<number> {
  // Create the meal plan
  const [mealPlan] = await db
    .insert(mealPlans)
    .values({
      userId,
      name,
      description,
    })
    .returning();

  if (!mealPlan) {
    throw new Error("Failed to create meal plan");
  }

  // Calculate week start if not provided (fallback to current week)
  const weekStartDate = weekStart ?? (() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(now);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  })();

  // Get all current week meals
  const { startDate, endDate } = getWeekDateRange(weekStartDate);

  const currentMeals = await db
    .select()
    .from(currentWeekMeals)
    .where(
      and(
        eq(currentWeekMeals.userId, userId),
        gte(currentWeekMeals.date, startDate),
        lte(currentWeekMeals.date, endDate)
      )
    );

  // Copy meals to the new plan
  if (currentMeals.length > 0) {
    await db.insert(plannedMeals).values(
      currentMeals.map((meal) => ({
        userId: meal.userId,
        recipeId: meal.recipeId,
        date: meal.date,
        mealType: meal.mealType,
        mealPlanId: mealPlan.id,
      }))
    );
  }

  return mealPlan.id;
}

// Load a saved meal plan to current week
export async function loadMealPlanToCurrentWeek(
  userId: string,
  mealPlanId: number
): Promise<void> {
  // Clear current week
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
  const { startDate, endDate } = getWeekDateRange(weekStart);

  await db
    .delete(currentWeekMeals)
    .where(
      and(
        eq(currentWeekMeals.userId, userId),
        gte(currentWeekMeals.date, startDate),
        lte(currentWeekMeals.date, endDate)
      )
    );

  // Get meals from the saved plan
  const planMeals = await db
    .select()
    .from(plannedMeals)
    .where(
      and(
        eq(plannedMeals.userId, userId),
        eq(plannedMeals.mealPlanId, mealPlanId)
      )
    );

  // Copy meals to current week
  if (planMeals.length > 0) {
    await db.insert(currentWeekMeals).values(
      planMeals.map((meal) => ({
        userId: meal.userId,
        recipeId: meal.recipeId,
        date: meal.date,
        mealType: meal.mealType,
      }))
    );
  }
}

// Get all saved meal plans for a user
export async function getUserMealPlans(userId: string) {
  return await db
    .select()
    .from(mealPlans)
    .where(eq(mealPlans.userId, userId))
    .orderBy(desc(mealPlans.updatedAt));
}

// Delete a meal plan
export async function deleteMealPlan(
  userId: string,
  mealPlanId: number
): Promise<void> {
  // Wrap deletions in transaction to ensure atomicity
  await db.transaction(async (tx) => {
    // Delete all planned meals for this plan
    await tx
      .delete(plannedMeals)
      .where(
        and(
          eq(plannedMeals.userId, userId),
          eq(plannedMeals.mealPlanId, mealPlanId)
        )
      );

    // Delete the meal plan
    await tx
      .delete(mealPlans)
      .where(and(eq(mealPlans.id, mealPlanId), eq(mealPlans.userId, userId)));
  });
}

// Check if current week has been added to shopping list
export async function hasCurrentWeekBeenAddedToShoppingList(
  userId: string,
  weekStart: Date
): Promise<boolean> {
  const { startDate, endDate } = getWeekDateRange(weekStart);

  const meals = await db
    .select()
    .from(currentWeekMeals)
    .where(
      and(
        eq(currentWeekMeals.userId, userId),
        eq(currentWeekMeals.addedToShoppingList, true),
        gte(currentWeekMeals.date, startDate),
        lte(currentWeekMeals.date, endDate)
      )
    )
    .limit(1);

  return meals.length > 0;
}

// Mark current week as added to shopping list
export async function markCurrentWeekAsAddedToShoppingList(
  userId: string,
  weekStart: Date
): Promise<void> {
  const { startDate, endDate } = getWeekDateRange(weekStart);

  await db
    .update(currentWeekMeals)
    .set({ addedToShoppingList: true })
    .where(
      and(
        eq(currentWeekMeals.userId, userId),
        gte(currentWeekMeals.date, startDate),
        lte(currentWeekMeals.date, endDate)
      )
    );
  return;
}
