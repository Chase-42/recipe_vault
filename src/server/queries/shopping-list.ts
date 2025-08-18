import { and, desc, eq, inArray } from "drizzle-orm";
import { RecipeError } from "~/lib/errors";
import { logger } from "~/lib/logger";
import { db } from "../db";
import { shoppingItems, recipes, currentWeekMeals } from "../db/schema";
import { generateShoppingListFromIngredients } from "~/utils/ingredientParser";
import type { ParsedIngredient } from "~/types";

export async function getShoppingItems(userId: string) {
  try {
    return await db
      .select()
      .from(shoppingItems)
      .where(eq(shoppingItems.userId, userId))
      .orderBy(desc(shoppingItems.createdAt));
  } catch (error) {
    logger.error(
      "Failed to fetch shopping items",
      error instanceof Error ? error : new Error(String(error)),
      {
        component: "ShoppingListQueries",
        action: "getShoppingItems",
        userId,
      }
    );
    throw new RecipeError("Failed to fetch shopping items", 500);
  }
}

export async function updateShoppingItem(
  userId: string,
  itemId: number,
  checked: boolean
) {
  try {
    const [updatedItem] = await db
      .update(shoppingItems)
      .set({ checked })
      .where(
        and(eq(shoppingItems.id, itemId), eq(shoppingItems.userId, userId))
      )
      .returning();

    return updatedItem;
  } catch (error) {
    logger.error(
      "Failed to update shopping item",
      error instanceof Error ? error : new Error(String(error)),
      {
        component: "ShoppingListQueries",
        action: "updateShoppingItem",
        userId,
        itemId,
      }
    );
    throw new RecipeError("Failed to update shopping item", 500);
  }
}

export async function deleteShoppingItem(userId: string, itemId: number) {
  try {
    const [deletedItem] = await db
      .delete(shoppingItems)
      .where(
        and(eq(shoppingItems.id, itemId), eq(shoppingItems.userId, userId))
      )
      .returning();

    return deletedItem;
  } catch (error) {
    logger.error(
      "Failed to delete shopping item",
      error instanceof Error ? error : new Error(String(error)),
      {
        component: "ShoppingListQueries",
        action: "deleteShoppingItem",
        userId,
        itemId,
      }
    );
    throw new RecipeError("Failed to delete shopping item", 500);
  }
}

export async function addShoppingItems(
  userId: string,
  items: Array<{ name: string; recipeId?: number; fromMealPlan?: boolean }>
) {
  try {
    const itemsToInsert = items.map((item) => ({
      userId,
      name: item.name,
      recipeId: item.recipeId,
      checked: false,
      fromMealPlan: item.fromMealPlan ?? false,
    }));

    return await db.insert(shoppingItems).values(itemsToInsert).returning();
  } catch (error) {
    logger.error(
      "Failed to add shopping items",
      error instanceof Error ? error : new Error(String(error)),
      {
        component: "ShoppingListQueries",
        action: "addShoppingItems",
        userId,
        itemCount: items.length,
      }
    );
    throw new RecipeError("Failed to add shopping items", 500);
  }
}

export async function generateShoppingListFromWeek(
  userId: string,
  weekStart: Date
): Promise<ParsedIngredient[]> {
  try {
    // Calculate week end (6 days after start)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    // Get all planned meals for the week with their recipes
    const plannedMeals = await db
      .select({
        recipeId: currentWeekMeals.recipeId,
        ingredients: recipes.ingredients,
      })
      .from(currentWeekMeals)
      .innerJoin(recipes, eq(currentWeekMeals.recipeId, recipes.id))
      .where(
        and(
          eq(currentWeekMeals.userId, userId),
          eq(recipes.userId, userId) // Ensure user can only access their own recipes
        )
      );

    if (plannedMeals.length === 0) {
      return [];
    }

    // Transform to the format expected by the ingredient parser
    const recipeIngredients = plannedMeals.map((meal) => ({
      recipeId: meal.recipeId,
      ingredients: meal.ingredients
        ? meal.ingredients.split("\n").filter((line) => line.trim())
        : [],
    }));

    // Generate and consolidate shopping list
    return generateShoppingListFromIngredients(recipeIngredients);
  } catch (error) {
    logger.error(
      "Failed to generate shopping list from week",
      error instanceof Error ? error : new Error(String(error)),
      {
        component: "ShoppingListQueries",
        action: "generateShoppingListFromWeek",
        userId,
        weekStart: weekStart.toISOString(),
      }
    );
    throw new RecipeError("Failed to generate shopping list from week", 500);
  }
}

export async function addMealPlanItemsToShoppingList(
  userId: string,
  ingredients: ParsedIngredient[]
): Promise<void> {
  try {
    if (ingredients.length === 0) return;

    // Convert parsed ingredients to shopping items
    const items = ingredients.map((ingredient) => ({
      name:
        ingredient.quantity && ingredient.unit
          ? `${ingredient.quantity} ${ingredient.unit} ${ingredient.name}`
          : ingredient.quantity
            ? `${ingredient.quantity} ${ingredient.name}`
            : ingredient.name,
      recipeId: (ingredient as ParsedIngredient & { recipeId?: number })
        .recipeId,
      fromMealPlan: true,
    }));

    await addShoppingItems(userId, items);
  } catch (error) {
    logger.error(
      "Failed to add meal plan items to shopping list",
      error instanceof Error ? error : new Error(String(error)),
      {
        component: "ShoppingListQueries",
        action: "addMealPlanItemsToShoppingList",
        userId,
        itemCount: ingredients.length,
      }
    );
    throw new RecipeError(
      "Failed to add meal plan items to shopping list",
      500
    );
  }
}

export async function clearMealPlanItemsFromShoppingList(
  userId: string
): Promise<void> {
  try {
    await db
      .delete(shoppingItems)
      .where(
        and(
          eq(shoppingItems.userId, userId),
          eq(shoppingItems.fromMealPlan, true)
        )
      );
  } catch (error) {
    logger.error(
      "Failed to clear meal plan items from shopping list",
      error instanceof Error ? error : new Error(String(error)),
      {
        component: "ShoppingListQueries",
        action: "clearMealPlanItemsFromShoppingList",
        userId,
      }
    );
    throw new RecipeError(
      "Failed to clear meal plan items from shopping list",
      500
    );
  }
}
