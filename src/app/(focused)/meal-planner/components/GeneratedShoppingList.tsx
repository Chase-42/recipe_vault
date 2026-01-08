"use client";

import { useState, useCallback, memo } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { ShoppingCart, Plus, Loader2, AlertCircle } from "lucide-react";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { handleError } from "~/lib/errorHandler";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { EnhancedGeneratedShoppingList } from "~/components/shopping-lists/EnhancedGeneratedShoppingList";
import type {
  ParsedIngredient,
  GeneratedShoppingListProps,
  EnhancedGeneratedShoppingListProps,
  EnhancedParsedIngredient,
} from "~/types";
import React from "react";

// Type guard to check if ingredients are enhanced
function isEnhancedIngredients(
  ingredients: ParsedIngredient[] | EnhancedParsedIngredient[]
): ingredients is EnhancedParsedIngredient[] {
  return (
    ingredients.length > 0 &&
    ingredients[0] != null &&
    "id" in ingredients[0] &&
    "sourceRecipes" in ingredients[0]
  );
}

// Memoized ingredient item component
const IngredientItem = memo(
  ({
    ingredient,
    index,
    isSelected,
    onToggle,
    isDisabled,
  }: {
    ingredient: ParsedIngredient;
    index: number;
    isSelected: boolean;
    onToggle: (index: number) => void;
    isDisabled: boolean;
  }) => {
    const formatIngredientDisplay = useCallback(
      (ingredient: ParsedIngredient): string => {
        if (ingredient.quantity) {
          return `${ingredient.quantity} ${ingredient.name}`;
        }
        return ingredient.name;
      },
      []
    );

    const handleToggle = useCallback(() => {
      onToggle(index);
    }, [index, onToggle]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleToggle();
        }
      },
      [handleToggle]
    );

    return (
      <div
        className={`flex items-center gap-2 p-2 rounded-lg border transition-colors focus-within:ring-2 focus-within:ring-blue-500 ${
          isSelected
            ? "bg-primary/5 border-primary/20"
            : "bg-background hover:bg-muted/50"
        }`}
        role="listitem"
      >
        <input
          type="checkbox"
          id={`ingredient-${index}`}
          checked={isSelected}
          onChange={handleToggle}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
          disabled={isDisabled}
          aria-describedby={`ingredient-${index}-description`}
        />
        <label
          htmlFor={`ingredient-${index}`}
          className="flex-1 cursor-pointer"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
        >
          <div className="font-medium">
            {formatIngredientDisplay(ingredient)}
          </div>
          {ingredient.originalText !== formatIngredientDisplay(ingredient) && (
            <div className="text-sm text-muted-foreground">
              Original: {ingredient.originalText}
            </div>
          )}
        </label>
        <div id={`ingredient-${index}-description`} className="sr-only">
          {isSelected ? "Selected" : "Not selected"} ingredient:{" "}
          {formatIngredientDisplay(ingredient)}
        </div>
      </div>
    );
  }
);

IngredientItem.displayName = "IngredientItem";

// Enhanced wrapper component that can handle both legacy and enhanced props
export const GeneratedShoppingList = memo(function GeneratedShoppingList(
  props: GeneratedShoppingListProps | EnhancedGeneratedShoppingListProps
) {
  // Check if this is the enhanced version
  if ("existingItems" in props && isEnhancedIngredients(props.ingredients)) {
    return (
      <EnhancedGeneratedShoppingList
        {...props}
      />
    );
  }

  // Legacy version
  return (
    <LegacyGeneratedShoppingList {...(props as GeneratedShoppingListProps)} />
  );
});

// Legacy component (renamed from the original)
const LegacyGeneratedShoppingList = memo(function LegacyGeneratedShoppingList({
  ingredients,
  onAddToShoppingList,
  isLoading = false,
  isAddingToList = false,
  error = null,
  onRetry,
}: GeneratedShoppingListProps) {
  const [selectedIngredients, setSelectedIngredients] = useState<Set<number>>(
    new Set(ingredients.map((_, index) => index))
  );

  // Update selected ingredients when ingredients change
  React.useEffect(() => {
    setSelectedIngredients(new Set(ingredients.map((_, index) => index)));
  }, [ingredients]);

  const handleIngredientToggle = useCallback((index: number) => {
    setSelectedIngredients((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(index)) {
        newSelected.delete(index);
      } else {
        newSelected.add(index);
      }
      return newSelected;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIngredients.size === ingredients.length) {
      setSelectedIngredients(new Set());
    } else {
      setSelectedIngredients(new Set(ingredients.map((_, index) => index)));
    }
  }, [selectedIngredients.size, ingredients]);

  const handleAddToShoppingList = useCallback(async () => {
    try {
      const selectedItems = ingredients.filter((_, index) =>
        selectedIngredients.has(index)
      );
      await onAddToShoppingList(selectedItems);
    } catch (error) {
      handleError(error, "Add ingredients to shopping list");
    }
  }, [ingredients, selectedIngredients, onAddToShoppingList]);

  // Error state
  if (error) {
    return (
      <ErrorBoundary>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              Generated Shopping List
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-center py-6 space-y-3">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
              <div className="text-sm text-muted-foreground">
                Failed to generate shopping list. Please try again.
              </div>
              {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry}>
                  Retry
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </ErrorBoundary>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            Generated Shopping List
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div
            className="flex h-24 items-center justify-center"
            role="status"
            aria-live="polite"
          >
            <LoadingSpinner size="md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (ingredients.length === 0) {
    return (
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            Generated Shopping List
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p
            className="text-muted-foreground text-center py-6"
            role="status"
            aria-live="polite"
          >
            Add meals to your weekly plan to generate a shopping list
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ErrorBoundary>
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            Generated Shopping List
            <Badge
              variant="secondary"
              aria-label={`${ingredients.length} items in shopping list`}
            >
              {ingredients.length} items
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          <div
            className="flex items-center justify-between"
            role="group"
            aria-label="Shopping list actions"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={isAddingToList}
              aria-label={
                selectedIngredients.size === ingredients.length
                  ? "Deselect all ingredients"
                  : "Select all ingredients"
              }
            >
              {selectedIngredients.size === ingredients.length
                ? "Deselect All"
                : "Select All"}
            </Button>
            <Button
              onClick={handleAddToShoppingList}
              disabled={selectedIngredients.size === 0 || isAddingToList}
              className="flex items-center gap-2"
              aria-label={`Add ${selectedIngredients.size} selected ingredients to shopping list`}
            >
              {isAddingToList ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="h-4 w-4" aria-hidden="true" />
              )}
              Add to Shopping List ({selectedIngredients.size})
            </Button>
          </div>

          <div
            className="space-y-2 max-h-80 overflow-y-auto"
            role="group"
            aria-label="Shopping list ingredients"
          >
            {ingredients.map((ingredient, index) => (
              <IngredientItem
                key={`${ingredient.name}-${index}`}
                ingredient={ingredient}
                index={index}
                isSelected={selectedIngredients.has(index)}
                onToggle={handleIngredientToggle}
                isDisabled={isAddingToList}
              />
            ))}
          </div>

          {selectedIngredients.size > 0 && (
            <div
              className="text-sm text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              {selectedIngredients.size} of {ingredients.length} items selected
            </div>
          )}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
});
