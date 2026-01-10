import { and, desc, eq, inArray } from "drizzle-orm";
import { RecipeError } from "~/lib/errors";
import { logger } from "~/lib/logger";
import { db } from "../db";
import { shoppingItems, recipes, currentWeekMeals } from "../db/schema";
import {
  generateShoppingListFromIngredients,
  generateEnhancedShoppingListFromIngredients,
} from "~/utils/ingredientParser";
import { detectDuplicates } from "~/utils/duplicateDetection";
import type {
  ParsedIngredient,
  ProcessedIngredient,
  GenerateEnhancedShoppingListResponse,
  DuplicateAnalysis,
  DuplicateMatch,
  ShoppingItem,
} from "~/types";

export async function getShoppingItems(
  userId: string
): Promise<ShoppingItem[]> {
  try {
    // Explicitly select columns that exist in the database (excluding category)
    const items = await db
      .select({
        id: shoppingItems.id,
        userId: shoppingItems.userId,
        name: shoppingItems.name,
        checked: shoppingItems.checked,
        recipeId: shoppingItems.recipeId,
        fromMealPlan: shoppingItems.fromMealPlan,
        createdAt: shoppingItems.createdAt,
      })
      .from(shoppingItems)
      .where(eq(shoppingItems.userId, userId))
      .orderBy(desc(shoppingItems.createdAt));

    // Convert Date objects to strings to match ShoppingItem type
    return items.map((item) => ({
      ...item,
      recipeId: item.recipeId ?? undefined,
      createdAt: item.createdAt.toISOString(),
    }));
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
): Promise<ShoppingItem | undefined> {
  try {
    await db
      .update(shoppingItems)
      .set({ checked })
      .where(
        and(eq(shoppingItems.id, itemId), eq(shoppingItems.userId, userId))
      );

    // Fetch the updated item explicitly selecting only existing columns
    const [updatedItem] = await db
      .select({
        id: shoppingItems.id,
        userId: shoppingItems.userId,
        name: shoppingItems.name,
        checked: shoppingItems.checked,
        recipeId: shoppingItems.recipeId,
        fromMealPlan: shoppingItems.fromMealPlan,
        createdAt: shoppingItems.createdAt,
      })
      .from(shoppingItems)
      .where(
        and(eq(shoppingItems.id, itemId), eq(shoppingItems.userId, userId))
      );

    return updatedItem
      ? {
          ...updatedItem,
          recipeId: updatedItem.recipeId ?? undefined,
          createdAt: updatedItem.createdAt.toISOString(),
        }
      : undefined;
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

export async function batchUpdateShoppingItems(
  userId: string,
  itemIds: number[],
  checked: boolean
): Promise<ShoppingItem[]> {
  try {
    if (itemIds.length === 0) {
      return [];
    }

    // Update all items in a single query
    await db
      .update(shoppingItems)
      .set({ checked })
      .where(
        and(
          inArray(shoppingItems.id, itemIds),
          eq(shoppingItems.userId, userId)
        )
      );

    // Fetch the updated items explicitly selecting only existing columns
    const updatedItems = await db
      .select({
        id: shoppingItems.id,
        userId: shoppingItems.userId,
        name: shoppingItems.name,
        checked: shoppingItems.checked,
        recipeId: shoppingItems.recipeId,
        fromMealPlan: shoppingItems.fromMealPlan,
        createdAt: shoppingItems.createdAt,
      })
      .from(shoppingItems)
      .where(
        and(
          inArray(shoppingItems.id, itemIds),
          eq(shoppingItems.userId, userId)
        )
      );

    // Convert Date objects to strings to match ShoppingItem type
    return updatedItems.map((item) => ({
      ...item,
      recipeId: item.recipeId ?? undefined,
      createdAt: item.createdAt.toISOString(),
    }));
  } catch (error) {
    logger.error(
      "Failed to batch update shopping items",
      error instanceof Error ? error : new Error(String(error)),
      {
        component: "ShoppingListQueries",
        action: "batchUpdateShoppingItems",
        userId,
        itemCount: itemIds.length,
      }
    );
    throw new RecipeError("Failed to batch update shopping items", 500);
  }
}

export async function deleteShoppingItem(userId: string, itemId: number) {
  try {
    // Fetch the item before deleting (explicitly selecting only existing columns)
    const [itemToDelete] = await db
      .select({
        id: shoppingItems.id,
        userId: shoppingItems.userId,
        name: shoppingItems.name,
        checked: shoppingItems.checked,
        recipeId: shoppingItems.recipeId,
        fromMealPlan: shoppingItems.fromMealPlan,
        createdAt: shoppingItems.createdAt,
      })
      .from(shoppingItems)
      .where(
        and(eq(shoppingItems.id, itemId), eq(shoppingItems.userId, userId))
      );

    await db
      .delete(shoppingItems)
      .where(
        and(eq(shoppingItems.id, itemId), eq(shoppingItems.userId, userId))
      );

    return itemToDelete;
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
): Promise<ShoppingItem[]> {
  try {
    const itemsToInsert = items.map((item) => ({
      userId,
      name: item.name,
      recipeId: item.recipeId,
      checked: false,
      fromMealPlan: item.fromMealPlan ?? false,
    }));

    // Insert items (without category - let database default handle it if column exists)
    await db.insert(shoppingItems).values(itemsToInsert);

    // Fetch the inserted items by matching the exact combinations we inserted
    // We'll fetch recent items matching our criteria, ordered by creation time
    const allMatchingItems = await db
      .select({
        id: shoppingItems.id,
        userId: shoppingItems.userId,
        name: shoppingItems.name,
        checked: shoppingItems.checked,
        recipeId: shoppingItems.recipeId,
        fromMealPlan: shoppingItems.fromMealPlan,
        createdAt: shoppingItems.createdAt,
      })
      .from(shoppingItems)
      .where(
        and(
          eq(shoppingItems.userId, userId),
          // Match items we just inserted by name
          inArray(
            shoppingItems.name,
            itemsToInsert.map((item) => item.name)
          )
        )
      )
      .orderBy(desc(shoppingItems.createdAt))
      .limit(itemsToInsert.length * 2); // Get extra to account for potential duplicates

    // Match inserted items to what we inserted, prioritizing most recent matches
    const insertedItems: ShoppingItem[] = [];
    const usedIds = new Set<number>();

    for (const itemToInsert of itemsToInsert) {
      const match = allMatchingItems.find(
        (item) =>
          !usedIds.has(item.id) &&
          item.name === itemToInsert.name &&
          item.recipeId === itemToInsert.recipeId &&
          item.fromMealPlan === itemToInsert.fromMealPlan
      );

      if (match) {
        usedIds.add(match.id);
        insertedItems.push({
          ...match,
          recipeId: match.recipeId ?? undefined,
          createdAt: match.createdAt.toISOString(),
        });
      }
    }

    return insertedItems;
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
    const items = ingredients.map((ingredient) => {
      const recipeId = (ingredient as ParsedIngredient & { recipeId?: number })
        .recipeId;

      return {
        name: ingredient.quantity
          ? `${ingredient.quantity} ${ingredient.name}`
          : ingredient.name,
        recipeId,
        fromMealPlan: true,
      };
    });

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

// Generate enhanced shopping list from week with duplicate detection and existing items
export async function generateEnhancedShoppingListFromWeek(
  userId: string,
  weekStart: Date
): Promise<GenerateEnhancedShoppingListResponse> {
  try {
    // Calculate week end (6 days after start)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    // Get all planned meals for the week with their recipes
    const plannedMeals = await db
      .select({
        recipeId: currentWeekMeals.recipeId,
        recipeName: recipes.name,
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

    // Early exit if no planned meals - avoid expensive shopping list query
    if (plannedMeals.length === 0) {
      return {
        ingredients: [],
        existingItems: [], // Return empty array instead of querying
        duplicateAnalysis: {
          totalDuplicates: 0,
          highConfidenceMatches: 0,
          suggestedActions: [],
        },
      };
    }

    // Get existing shopping list items only if we have planned meals
    const existingItems = await getShoppingItems(userId);

    // Transform to the format expected by the enhanced ingredient parser
    const recipeIngredients = plannedMeals.map((meal) => ({
      recipeId: meal.recipeId,
      recipeName: meal.recipeName,
      ingredients: meal.ingredients
        ? meal.ingredients.split("\n").filter((line) => line.trim())
        : [],
    }));

    // Generate enhanced shopping list with source tracking
    const enhancedIngredients =
      generateEnhancedShoppingListFromIngredients(recipeIngredients);

    // Detect duplicates between new ingredients and existing items (with timeout protection)
    let duplicateMap: Map<string, DuplicateMatch[]>;
    try {
      // Skip duplicate detection if we have too many items to avoid performance issues
      if (enhancedIngredients.length > 50 || existingItems.length > 200) {
        duplicateMap = new Map();
      } else {
        duplicateMap = detectDuplicates(enhancedIngredients, existingItems);
      }
    } catch (error) {
      // If duplicate detection fails, continue without it
      logger.warn(
        "Duplicate detection failed, continuing without duplicate analysis"
      );
      duplicateMap = new Map();
    }

    // Add duplicate matches to enhanced ingredients
    enhancedIngredients.forEach((ingredient) => {
      const matches = duplicateMap.get(ingredient.id) ?? [];
      ingredient.duplicateMatches = matches;
    });

    // Generate duplicate analysis
    const duplicateAnalysis: DuplicateAnalysis = {
      totalDuplicates: duplicateMap.size,
      highConfidenceMatches: Array.from(duplicateMap.values()).reduce(
        (count, matches) => {
          return (
            count +
            matches.filter((match) => match.matchConfidence === "high").length
          );
        },
        0
      ),
      suggestedActions: enhancedIngredients
        .filter((ingredient) => ingredient.duplicateMatches.length > 0)
        .map((ingredient) => {
          const bestMatch = ingredient.duplicateMatches[0]; // First match is highest confidence
          return {
            ingredientId: ingredient.id,
            action: bestMatch?.suggestedAction ?? "add_separate",
            reason: bestMatch
              ? `${bestMatch.matchConfidence} confidence match with "${bestMatch.existingItemName}"`
              : "No clear match found",
          };
        }),
    };

    return {
      ingredients: enhancedIngredients,
      existingItems,
      duplicateAnalysis,
    };
  } catch (error) {
    logger.error(
      "Failed to generate enhanced shopping list from week",
      error instanceof Error ? error : new Error(String(error)),
      {
        component: "ShoppingListQueries",
        action: "generateEnhancedShoppingListFromWeek",
        userId,
        weekStart: weekStart.toISOString(),
      }
    );
    throw new RecipeError(
      "Failed to generate enhanced shopping list from week",
      500
    );
  }
}

// Add processed ingredients to shopping list with duplicate handling
// Local interface for processing ingredients with additional properties
interface ProcessedIngredientWithActions extends ProcessedIngredient {
  displayName: string;
  duplicateAction?: DuplicateMatch;
}

export async function addProcessedIngredientsToShoppingList(
  userId: string,
  ingredients: ProcessedIngredient[]
): Promise<{
  addedItems: ShoppingItem[];
  updatedItems: ShoppingItem[];
}> {
  try {
    const addedItems: ShoppingItem[] = [];
    const updatedItems: ShoppingItem[] = [];

    // Separate ingredients by action type for batch processing
    const toSkip: ProcessedIngredientWithActions[] = [];
    const toCombine: ProcessedIngredientWithActions[] = [];
    const toAdd: ProcessedIngredientWithActions[] = [];

    // Process ingredients and format display names
    const processedForBatch: ProcessedIngredientWithActions[] = ingredients.map(
      (ingredient) => {
        const finalQuantity = ingredient.editedQuantity ?? ingredient.quantity;

        let displayName = ingredient.name;
        if (finalQuantity) {
          displayName = `${finalQuantity} ${ingredient.name}`;
        }

        const duplicateAction = ingredient.duplicateMatches[0];

        return {
          ...ingredient,
          displayName,
          duplicateAction,
        };
      }
    );

    // Categorize by action
    for (const ingredient of processedForBatch) {
      if (ingredient.duplicateAction?.suggestedAction === "skip") {
        toSkip.push(ingredient);
      } else if (
        ingredient.duplicateAction?.suggestedAction === "combine" &&
        ingredient.duplicateAction.existingItemId
      ) {
        toCombine.push(ingredient);
      } else {
        toAdd.push(ingredient);
      }
    }

    // Batch update existing items for combine actions
    if (toCombine.length > 0) {
      const existingItemIds = toCombine
        .map((ing) => ing.duplicateAction?.existingItemId)
        .filter((id): id is number => id != null);

      if (existingItemIds.length > 0) {
        const existingItems = await db
          .select({
            id: shoppingItems.id,
            userId: shoppingItems.userId,
            name: shoppingItems.name,
            checked: shoppingItems.checked,
            recipeId: shoppingItems.recipeId,
            fromMealPlan: shoppingItems.fromMealPlan,
            createdAt: shoppingItems.createdAt,
          })
          .from(shoppingItems)
          .where(
            and(
              inArray(shoppingItems.id, existingItemIds),
              eq(shoppingItems.userId, userId)
            )
          );

        // Update each existing item
        for (const ingredient of toCombine) {
          const existingItem = existingItems.find(
            (item) => item.id === ingredient.duplicateAction?.existingItemId
          );

          if (existingItem) {
            try {
              const combinedName = `${existingItem.name} + ${ingredient.displayName}`;

              await db
                .update(shoppingItems)
                .set({
                  name: combinedName,
                  fromMealPlan: true,
                })
                .where(
                  and(
                    eq(shoppingItems.id, existingItem.id),
                    eq(shoppingItems.userId, userId)
                  )
                );

              // Fetch the updated item explicitly selecting only existing columns
              const [updatedItem] = await db
                .select({
                  id: shoppingItems.id,
                  userId: shoppingItems.userId,
                  name: shoppingItems.name,
                  checked: shoppingItems.checked,
                  recipeId: shoppingItems.recipeId,
                  fromMealPlan: shoppingItems.fromMealPlan,
                  createdAt: shoppingItems.createdAt,
                })
                .from(shoppingItems)
                .where(
                  and(
                    eq(shoppingItems.id, existingItem.id),
                    eq(shoppingItems.userId, userId)
                  )
                );

              if (updatedItem) {
                updatedItems.push({
                  ...updatedItem,
                  recipeId: updatedItem.recipeId ?? undefined,
                  createdAt: updatedItem.createdAt.toISOString(),
                });
              }
            } catch (error) {
              logger.error(
                "Failed to combine with existing item, will add as new item",
                error instanceof Error ? error : new Error(String(error)),
                {
                  component: "ShoppingListQueries",
                  action: "addProcessedIngredientsToShoppingList",
                  userId,
                  existingItemId: existingItem.id,
                }
              );
              // Add to toAdd list instead
              toAdd.push(ingredient);
            }
          } else {
            // Existing item not found, add as new
            toAdd.push(ingredient);
          }
        }
      }
    }

    // Batch add new items
    if (toAdd.length > 0) {
      const itemsToInsert = toAdd.map((ingredient) => ({
        name: ingredient.displayName,
        recipeId: ingredient.sourceRecipes[0]?.recipeId,
        fromMealPlan: true,
      }));

      const newItems = await addShoppingItems(userId, itemsToInsert);
      addedItems.push(...newItems);
    }

    return { addedItems, updatedItems };
  } catch (error) {
    logger.error(
      "Failed to add processed ingredients to shopping list",
      error instanceof Error ? error : new Error(String(error)),
      {
        component: "ShoppingListQueries",
        action: "addProcessedIngredientsToShoppingList",
        userId,
        ingredientCount: ingredients.length,
      }
    );
    throw new RecipeError(
      "Failed to add processed ingredients to shopping list",
      500
    );
  }
}
