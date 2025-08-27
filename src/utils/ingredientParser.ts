import { logger } from "~/lib/logger";
import type { ParsedIngredient, EnhancedParsedIngredient } from "~/types";

// Common units and their variations for normalization
const UNIT_MAPPINGS: Record<string, string> = {
  // Volume
  cup: "cup",
  cups: "cup",
  c: "cup",
  tablespoon: "tbsp",
  tablespoons: "tbsp",
  tbsp: "tbsp",
  tbs: "tbsp",
  teaspoon: "tsp",
  teaspoons: "tsp",
  tsp: "tsp",
  "fluid ounce": "fl oz",
  "fluid ounces": "fl oz",
  "fl oz": "fl oz",
  pint: "pint",
  pints: "pint",
  pt: "pint",
  quart: "quart",
  quarts: "quart",
  qt: "quart",
  gallon: "gallon",
  gallons: "gallon",
  gal: "gallon",
  liter: "liter",
  liters: "liter",
  l: "liter",
  milliliter: "ml",
  milliliters: "ml",
  ml: "ml",

  // Weight
  pound: "lb",
  pounds: "lb",
  lb: "lb",
  lbs: "lb",
  ounce: "oz",
  ounces: "oz",
  oz: "oz",
  gram: "g",
  grams: "g",
  g: "g",
  kilogram: "kg",
  kilograms: "kg",
  kg: "kg",

  // Count
  piece: "piece",
  pieces: "piece",
  item: "piece",
  items: "piece",
  whole: "whole",
  each: "each",

  // Other common units
  clove: "clove",
  cloves: "clove",
  slice: "slice",
  slices: "slice",
  can: "can",
  cans: "can",
  jar: "jar",
  jars: "jar",
  package: "package",
  packages: "package",
  pkg: "package",
  bunch: "bunch",
  bunches: "bunch",
};

// Conversion factors to base units (for combining similar units)
const UNIT_CONVERSIONS: Record<string, { baseUnit: string; factor: number }> = {
  // Volume conversions to cups
  cup: { baseUnit: "cup", factor: 1 },
  tbsp: { baseUnit: "cup", factor: 1 / 16 },
  tsp: { baseUnit: "cup", factor: 1 / 48 },
  "fl oz": { baseUnit: "cup", factor: 1 / 8 },
  pint: { baseUnit: "cup", factor: 2 },
  quart: { baseUnit: "cup", factor: 4 },
  gallon: { baseUnit: "cup", factor: 16 },

  // Weight conversions to ounces
  oz: { baseUnit: "oz", factor: 1 },
  lb: { baseUnit: "oz", factor: 16 },
  g: { baseUnit: "g", factor: 1 },
  kg: { baseUnit: "g", factor: 1000 },
};

// Regex patterns for parsing ingredients
const INGREDIENT_PATTERNS = [
  // Pattern: "2 1/2 cups flour" (mixed fractions)
  /^(\d+\s+\d+\/\d+)\s+([a-zA-Z\s]+?)\s+(.+)$/,
  // Pattern: "2 cups flour" or "1/2 cup sugar"
  /^(\d+(?:\/\d+)?(?:\.\d+)?)\s+([a-zA-Z\s]+?)\s+(.+)$/,
  // Pattern: "2-3 cups flour" or "1-2 tablespoons oil"
  /^(\d+(?:\.\d+)?-\d+(?:\.\d+)?)\s+([a-zA-Z\s]+?)\s+(.+)$/,
  // Pattern: "flour, 2 cups" (ingredient first)
  /^(.+?),\s*(\d+(?:\/\d+)?(?:\.\d+)?)\s+([a-zA-Z\s]+)$/,
  // Pattern: "2 large eggs" or "3 medium onions" (quantity + descriptor + ingredient)
  /^(\d+(?:\/\d+)?(?:\.\d+)?)\s+([a-zA-Z\s]*?)\s*(.+)$/,
  // Pattern: "salt to taste" or "pepper as needed" (no quantity)
  /^(.+?)(?:\s+(?:to taste|as needed|optional))?$/,
];

/**
 * Parse a single ingredient string into structured data
 */
export function parseIngredient(ingredientText: string): ParsedIngredient {
  const trimmed = ingredientText.trim();

  if (!trimmed) {
    return {
      name: "",
      originalText: ingredientText,
    };
  }

  // Try each pattern
  for (const pattern of INGREDIENT_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      const [, quantityStr, unitOrDescriptor, nameOrUnit] = match;

      // Check if we have a clear quantity
      if (quantityStr && /^\d+/.test(quantityStr)) {
        const quantity = parseQuantity(quantityStr);
        const normalizedUnit = normalizeUnit(
          unitOrDescriptor?.toLowerCase().trim() || ""
        );

        // If the unit is recognized, include it in the name
        if (normalizedUnit && UNIT_MAPPINGS[normalizedUnit]) {
          const unitName = UNIT_MAPPINGS[normalizedUnit];
          return {
            name: cleanIngredientName(`${unitName} ${nameOrUnit || ""}`),
            quantity,
            originalText: ingredientText,
          };
        } else {
          // Unit not recognized, treat as part of ingredient name
          const fullName =
            `${unitOrDescriptor || ""} ${nameOrUnit || ""}`.trim();
          return {
            name: cleanIngredientName(fullName),
            quantity,
            originalText: ingredientText,
          };
        }
      }
    }
  }

  // If no pattern matches, return just the name
  return {
    name: cleanIngredientName(trimmed),
    originalText: ingredientText,
  };
}

/**
 * Parse multiple ingredient strings
 */
export function parseIngredients(
  ingredientTexts: string[]
): ParsedIngredient[] {
  return ingredientTexts
    .filter((text) => text.trim().length > 0)
    .map((text) => parseIngredient(text));
}

/**
 * Consolidate similar ingredients by combining quantities
 */
export function consolidateIngredients(
  ingredients: ParsedIngredient[]
): ParsedIngredient[] {
  const consolidated = new Map<string, ParsedIngredient>();

  for (const ingredient of ingredients) {
    const key = generateConsolidationKey(ingredient);
    const existing = consolidated.get(key);

    if (existing && canCombineIngredients(existing, ingredient)) {
      // Combine quantities
      const combinedQuantity = combineQuantities(existing, ingredient);
      consolidated.set(key, {
        ...existing,
        quantity: combinedQuantity.quantity,
        originalText: `${existing.originalText}; ${ingredient.originalText}`,
      });
    } else if (existing) {
      // Same ingredient name but different quantities - create unique key
      const uniqueKey = `${key}_${consolidated.size}`;
      consolidated.set(uniqueKey, { ...ingredient });
    } else {
      // New ingredient
      consolidated.set(key, { ...ingredient });
    }
  }

  return Array.from(consolidated.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

/**
 * Generate shopping list from meal plan ingredients
 */
export function generateShoppingListFromIngredients(
  recipeIngredients: Array<{ recipeId: number; ingredients: string[] }>
): ParsedIngredient[] {
  try {
    const allIngredients: ParsedIngredient[] = [];

    // Parse all ingredients from all recipes
    for (const { recipeId, ingredients } of recipeIngredients) {
      const parsed = parseIngredients(ingredients).map((ingredient) => ({
        ...ingredient,
        recipeId, // Track which recipe this came from
      }));
      allIngredients.push(...parsed);
    }

    // Consolidate similar ingredients
    return consolidateIngredients(allIngredients);
  } catch (error) {
    logger.error(
      "Failed to generate shopping list from ingredients",
      error instanceof Error ? error : new Error(String(error)),
      {
        component: "IngredientParser",
        action: "generateShoppingListFromIngredients",
        recipeCount: recipeIngredients.length,
      }
    );
    throw error;
  }
}

/**
 * Generate enhanced shopping list from meal plan ingredients with recipe source tracking
 */
export function generateEnhancedShoppingListFromIngredients(
  recipeIngredients: Array<{
    recipeId: number;
    recipeName: string;
    ingredients: string[];
  }>
): EnhancedParsedIngredient[] {
  try {
    const allIngredients: (ParsedIngredient & {
      recipeId: number;
      recipeName: string;
    })[] = [];

    // Parse all ingredients from all recipes with source tracking
    for (const { recipeId, recipeName, ingredients } of recipeIngredients) {
      const parsed = parseIngredients(ingredients).map((ingredient) => ({
        ...ingredient,
        recipeId,
        recipeName,
      }));
      allIngredients.push(...parsed);
    }

    // Group ingredients by name for consolidation while tracking sources
    const ingredientGroups = new Map<
      string,
      (ParsedIngredient & { recipeId: number; recipeName: string })[]
    >();

    for (const ingredient of allIngredients) {
      const key = generateConsolidationKey(ingredient);
      const existing = ingredientGroups.get(key) || [];
      existing.push(ingredient);
      ingredientGroups.set(key, existing);
    }

    // Convert to enhanced ingredients with source tracking
    const enhancedIngredients: EnhancedParsedIngredient[] = [];
    let idCounter = 0;

    for (const [, ingredientGroup] of ingredientGroups) {
      // Consolidate quantities for ingredients that can be combined
      const consolidatedIngredient = consolidateIngredients(ingredientGroup)[0];

      if (consolidatedIngredient) {
        // Collect unique source recipes
        const sourceRecipes = Array.from(
          new Map(
            ingredientGroup.map((ing) => [
              ing.recipeId,
              { recipeId: ing.recipeId, recipeName: ing.recipeName },
            ])
          ).values()
        );

        enhancedIngredients.push({
          ...consolidatedIngredient,
          id: `ingredient_${idCounter++}`,
          sourceRecipes,
          duplicateMatches: [], // Will be populated by duplicate detection
        });
      }
    }

    return enhancedIngredients.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    logger.error(
      "Failed to generate enhanced shopping list from ingredients",
      error instanceof Error ? error : new Error(String(error)),
      {
        component: "IngredientParser",
        action: "generateEnhancedShoppingListFromIngredients",
        recipeCount: recipeIngredients.length,
      }
    );
    throw error;
  }
}

// Helper functions

function parseQuantity(quantityStr: string): number {
  try {
    // Handle fractions like "1/2" or "2 1/2"
    if (quantityStr.includes("/")) {
      const parts = quantityStr.split(/\s+/);
      let total = 0;

      for (const part of parts) {
        if (part.includes("/")) {
          const [num, den] = part.split("/").map(Number);
          if (num !== undefined && den !== undefined && den !== 0) {
            total += num / den;
          }
        } else {
          total += Number(part);
        }
      }
      return total;
    }

    // Handle ranges like "2-3"
    if (quantityStr.includes("-")) {
      const [min, max] = quantityStr.split("-").map(Number);
      if (min !== undefined && max !== undefined) {
        return (min + max) / 2; // Use average
      }
    }

    return Number(quantityStr);
  } catch {
    return 1; // Default to 1 if parsing fails
  }
}

function normalizeUnit(unit: string): string {
  return unit.toLowerCase().replace(/[.,]/g, "").trim();
}

function cleanIngredientName(name: string): string {
  return name
    .trim()
    .replace(/^[,\-\s]+|[,\-\s]+$/g, "") // Remove leading/trailing punctuation
    .replace(/\s+/g, " ") // Normalize whitespace
    .toLowerCase();
}

function generateConsolidationKey(ingredient: ParsedIngredient): string {
  // Create a key for grouping similar ingredients
  const baseName = ingredient.name
    .toLowerCase()
    .replace(
      /\b(fresh|dried|chopped|diced|sliced|minced|grated|shredded)\b/g,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();

  return baseName;
}

function canCombineIngredients(
  a: ParsedIngredient,
  b: ParsedIngredient
): boolean {
  // If both have no quantities, they can be combined (e.g., "salt to taste")
  if (!a.quantity && !b.quantity) return true;

  // If only one has a quantity, they cannot be combined
  if (!a.quantity || !b.quantity) return false;

  // Both have quantities - they can be combined since units are now part of the name
  return true;
}

function combineQuantities(
  a: ParsedIngredient,
  b: ParsedIngredient
): { quantity?: number } {
  // If both have no quantities, return no quantity
  if (!a.quantity && !b.quantity) {
    return {};
  }

  // If only one has a quantity, return the sum
  if (!a.quantity || !b.quantity) {
    return {
      quantity: (a.quantity || 0) + (b.quantity || 0),
    };
  }

  // Both have quantities - just add them since units are now part of the name
  return { quantity: a.quantity + b.quantity };
}
