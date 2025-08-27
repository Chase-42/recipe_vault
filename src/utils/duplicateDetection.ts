import type { ParsedIngredient, ShoppingItem, DuplicateMatch } from "~/types";

// LRU cache for normalized names to avoid recalculation
const MAX_CACHE_SIZE = 500;
const normalizationCache = new Map<string, string>();

/**
 * Normalize ingredient name for better matching (with LRU caching)
 */
export function normalizeIngredientName(name: string): string {
  if (normalizationCache.has(name)) {
    // Move to end (most recently used)
    const value = normalizationCache.get(name)!;
    normalizationCache.delete(name);
    normalizationCache.set(name, value);
    return value;
  }

  const normalized = name
    .toLowerCase()
    .trim()
    // Remove common descriptors that don't affect the core ingredient
    .replace(
      /\b(fresh|dried|chopped|diced|sliced|minced|grated|shredded|ground|whole|large|medium|small|extra|organic|raw|cooked)\b/g,
      ""
    )
    // Remove punctuation and extra spaces
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Implement proper LRU eviction
  if (normalizationCache.size >= MAX_CACHE_SIZE) {
    // Remove least recently used (first entry)
    const firstKey = normalizationCache.keys().next().value;
    if (firstKey) {
      normalizationCache.delete(firstKey);
    }
  }
  normalizationCache.set(name, normalized);

  return normalized;
}

/**
 * Calculate similarity score between two ingredient names (optimized)
 */
export function calculateSimilarityScore(name1: string, name2: string): number {
  const normalized1 = normalizeIngredientName(name1);
  const normalized2 = normalizeIngredientName(name2);

  // Exact match after normalization
  if (normalized1 === normalized2) {
    return 1.0;
  }

  // Check if one is contained in the other
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return 0.8;
  }

  // Fast word-based similarity for better performance
  const words1 = normalized1.split(" ");
  const words2 = normalized2.split(" ");
  const commonWords = words1.filter((word) => words2.includes(word));

  if (commonWords.length > 0) {
    const wordSimilarity =
      commonWords.length / Math.max(words1.length, words2.length);

    // If we have good word overlap, skip expensive Levenshtein calculation
    if (wordSimilarity >= 0.5) {
      return Math.min(0.9, 0.6 + wordSimilarity * 0.3);
    }
  }

  // Only use Levenshtein for short strings or when word similarity is low
  if (Math.max(normalized1.length, normalized2.length) <= 15) {
    const distance = levenshteinDistance(normalized1, normalized2);
    const maxLength = Math.max(normalized1.length, normalized2.length);

    if (maxLength === 0) return 0;

    const similarity = 1 - distance / maxLength;

    // Add word boost if any
    if (commonWords.length > 0) {
      const wordBoost =
        commonWords.length / Math.max(words1.length, words2.length);
      return Math.min(1.0, similarity + wordBoost * 0.2);
    }

    return similarity;
  }

  // For longer strings, rely on word matching only
  return commonWords.length > 0 ? 0.4 : 0;
}

/**
 * Determine match confidence based on similarity score
 */
export function getMatchConfidence(score: number): "high" | "medium" | "low" {
  if (score >= 0.9) return "high";
  if (score >= 0.7) return "medium";
  return "low";
}

/**
 * Suggest action for duplicate handling
 */
export function suggestDuplicateAction(
  ingredient: ParsedIngredient,
  existingItem: ShoppingItem,
  confidence: "high" | "medium" | "low"
): "skip" | "combine" | "add_separate" {
  // High confidence matches should be combined if units are compatible
  if (confidence === "high") {
    if (
      canCombineUnits(
        extractUnitFromIngredientName(ingredient.name),
        extractUnitFromShoppingItem(existingItem.name)
      )
    ) {
      return "combine";
    }
    return "skip"; // Skip if units can't be combined
  }

  // Medium confidence matches should be reviewed by user, default to combine
  if (confidence === "medium") {
    return "combine";
  }

  // Low confidence matches should be added separately
  return "add_separate";
}

/**
 * Check if two units can be combined
 */
export function canCombineUnits(unit1?: string, unit2?: string): boolean {
  if (!unit1 && !unit2) return true; // Both have no units
  if (!unit1 || !unit2) return false; // Only one has a unit

  // Define unit compatibility groups
  const volumeUnits = [
    "cup",
    "tbsp",
    "tsp",
    "fl oz",
    "pint",
    "quart",
    "gallon",
    "ml",
    "liter",
  ];
  const weightUnits = ["oz", "lb", "g", "kg"];
  const countUnits = ["piece", "whole", "each", "clove", "slice"];

  const isUnit1Volume = volumeUnits.includes(unit1);
  const isUnit2Volume = volumeUnits.includes(unit2);
  const isUnit1Weight = weightUnits.includes(unit1);
  const isUnit2Weight = weightUnits.includes(unit2);
  const isUnit1Count = countUnits.includes(unit1);
  const isUnit2Count = countUnits.includes(unit2);

  return (
    (isUnit1Volume && isUnit2Volume) ||
    (isUnit1Weight && isUnit2Weight) ||
    (isUnit1Count && isUnit2Count)
  );
}

/**
 * Detect duplicate matches between new ingredients and existing shopping items
 * Optimized for performance with early exits and efficient string matching
 */
export function detectDuplicates(
  ingredients: ParsedIngredient[],
  existingItems: ShoppingItem[]
): Map<string, DuplicateMatch[]> {
  const duplicateMap = new Map<string, DuplicateMatch[]>();

  // Early exit if no existing items
  if (existingItems.length === 0) {
    return duplicateMap;
  }

  // Limit existing items to prevent performance issues with very large lists
  const itemsToCheck =
    existingItems.length > 100 ? existingItems.slice(0, 100) : existingItems;

  // Pre-normalize existing items for faster comparison
  const normalizedExistingItems = itemsToCheck.map((item) => ({
    ...item,
    normalizedName: normalizeIngredientName(item.name),
  }));

  ingredients.forEach((ingredient, index) => {
    const ingredientId = `ingredient_${index}`;
    const normalizedIngredientName = normalizeIngredientName(ingredient.name);
    const matches: DuplicateMatch[] = [];

    // Early exit for very short ingredient names
    if (normalizedIngredientName.length < 2) {
      return;
    }

    normalizedExistingItems.forEach((existingItem) => {
      // Quick length-based filter to avoid expensive calculations
      const lengthDiff = Math.abs(
        normalizedIngredientName.length - existingItem.normalizedName.length
      );
      if (
        lengthDiff >
        Math.max(
          normalizedIngredientName.length,
          existingItem.normalizedName.length
        ) *
          0.7
      ) {
        return; // Skip if length difference is too large
      }

      // Fast exact match check
      if (normalizedIngredientName === existingItem.normalizedName) {
        matches.push({
          existingItemId: existingItem.id,
          existingItemName: existingItem.name,
          matchConfidence: "high",
          suggestedAction: "combine",
        });
        return;
      }

      // Fast substring check
      if (
        normalizedIngredientName.includes(existingItem.normalizedName) ||
        existingItem.normalizedName.includes(normalizedIngredientName)
      ) {
        matches.push({
          existingItemId: existingItem.id,
          existingItemName: existingItem.name,
          matchConfidence: "high",
          suggestedAction: "combine",
        });
        return;
      }

      // Only do expensive similarity calculation for potential matches
      const firstWordMatch =
        normalizedIngredientName.split(" ")[0] ===
        existingItem.normalizedName.split(" ")[0];
      if (
        firstWordMatch ||
        normalizedIngredientName.length + existingItem.normalizedName.length <
          20
      ) {
        const score = calculateSimilarityScore(
          ingredient.name,
          existingItem.name
        );

        if (score >= 0.6) {
          const confidence = getMatchConfidence(score);
          const suggestedAction = suggestDuplicateAction(
            ingredient,
            existingItem,
            confidence
          );

          matches.push({
            existingItemId: existingItem.id,
            existingItemName: existingItem.name,
            matchConfidence: confidence,
            suggestedAction,
          });
        }
      }
    });

    if (matches.length > 0) {
      // Sort matches by confidence (high first) and limit to top 3
      matches.sort((a, b) => {
        const confidenceOrder = { high: 3, medium: 2, low: 1 };
        return (
          confidenceOrder[b.matchConfidence] -
          confidenceOrder[a.matchConfidence]
        );
      });

      duplicateMap.set(ingredientId, matches.slice(0, 3)); // Limit to top 3 matches
    }
  });

  return duplicateMap;
}

/**
 * Extract unit from ingredient name (e.g., "cups flour" -> "cups")
 */
function extractUnitFromIngredientName(
  ingredientName: string
): string | undefined {
  const words = ingredientName.toLowerCase().split(/\s+/);
  const commonUnits = [
    "cup",
    "cups",
    "tbsp",
    "tsp",
    "oz",
    "lb",
    "g",
    "kg",
    "ml",
    "liter",
    "piece",
    "pieces",
    "whole",
    "each",
    "clove",
    "cloves",
    "slice",
    "slices",
    "can",
    "cans",
    "jar",
    "jars",
    "package",
    "packages",
    "bunch",
    "bunches",
  ];

  for (const word of words) {
    if (commonUnits.includes(word)) {
      return word;
    }
  }
  return undefined;
}

/**
 * Extract unit from shopping item name (basic parsing)
 */
function extractUnitFromShoppingItem(itemName: string): string | undefined {
  const unitPattern = /^\d+(?:\.\d+)?\s+([a-zA-Z]+)/;
  const match = itemName.match(unitPattern);
  return match?.[1]?.toLowerCase();
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = Array(str2.length + 1)
    .fill(0)
    .map(() => Array(str1.length + 1).fill(0));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0]![i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j]![0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j]![i] = Math.min(
        matrix[j]![i - 1]! + 1, // deletion
        matrix[j - 1]![i]! + 1, // insertion
        matrix[j - 1]![i - 1]! + indicator // substitution
      );
    }
  }

  return matrix[str2.length]![str1.length]!;
}
