"use client";

import React, { useState, useCallback, useMemo, memo } from "react";
import { Button } from "~/components/ui/button";

import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Checkbox } from "~/components/ui/checkbox";
import { Separator } from "~/components/ui/separator";
import {
  Plus,
  Loader2,
  AlertCircle,
  CheckSquare,
  Square,
  AlertTriangle,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { handleError } from "~/lib/errorHandler";
import LoadingSpinner from "~/app/_components/LoadingSpinner";

import { cn } from "~/lib/utils";
import type {
  EnhancedParsedIngredient,
  EnhancedGeneratedShoppingListProps,
  ProcessedIngredient,
  ShoppingItem,
} from "~/types";

const EnhancedGeneratedShoppingList = memo(
  function EnhancedGeneratedShoppingList({
    ingredients,
    existingItems,
    onAddToShoppingList,
    isLoading = false,
    isAddingToList = false,
    error = null,
    onRetry,
  }: EnhancedGeneratedShoppingListProps) {
    // State for existing items panel
    const [isExistingCollapsed, setIsExistingCollapsed] = useState(false);

    // State for managing processed ingredients
    const [processedIngredients, setProcessedIngredients] = useState<
      Map<string, ProcessedIngredient>
    >(() => {
      const initialMap = new Map<string, ProcessedIngredient>();
      for (const ingredient of ingredients) {
        initialMap.set(ingredient.id, {
          ...ingredient,
          isSelected: true, // Default to selected
          duplicateMatches: ingredient.duplicateMatches,
          sourceRecipes: ingredient.sourceRecipes,
        });
      }
      return initialMap;
    });

    // Update processed ingredients when ingredients prop changes
    React.useEffect(() => {
      setProcessedIngredients((prevMap) => {
        const newMap = new Map<string, ProcessedIngredient>();
        for (const ingredient of ingredients) {
          const existing = prevMap.get(ingredient.id);
          newMap.set(ingredient.id, {
            ...ingredient,
            isSelected: existing?.isSelected ?? true,
            editedQuantity: existing?.editedQuantity,
            duplicateMatches: ingredient.duplicateMatches,
            sourceRecipes: ingredient.sourceRecipes,
          });
        }
        return newMap;
      });
    }, [ingredients]);

    // Get highlighted existing items (those that match new ingredients)
    const highlightedExistingItems = useMemo(() => {
      const highlighted = new Set<number>();
      for (const ingredient of processedIngredients.values()) {
        for (const match of ingredient.duplicateMatches) {
          highlighted.add(match.existingItemId);
        }
      }
      return Array.from(highlighted);
    }, [processedIngredients]);

    // Get selected ingredients count
    const selectedCount = useMemo(() => {
      let count = 0;
      for (const ingredient of processedIngredients.values()) {
        if (ingredient.isSelected) count++;
      }
      return count;
    }, [processedIngredients]);

    // Get duplicate count
    const duplicateCount = useMemo(() => {
      let count = 0;
      for (const ingredient of processedIngredients.values()) {
        if (ingredient.duplicateMatches.length > 0) count++;
      }
      return count;
    }, [processedIngredients]);

    // Event handlers
    const handleToggleSelection = useCallback((id: string) => {
      setProcessedIngredients((prev) => {
        const newMap = new Map(prev);
        const ingredient = newMap.get(id);
        if (ingredient) {
          newMap.set(id, { ...ingredient, isSelected: !ingredient.isSelected });
        }
        return newMap;
      });
    }, []);

    const handleQuantityChange = useCallback((id: string, quantity: number) => {
      setProcessedIngredients((prev) => {
        const newMap = new Map(prev);
        const ingredient = newMap.get(id);
        if (ingredient) {
          newMap.set(id, {
            ...ingredient,
            editedQuantity: quantity,
          });
        }
        return newMap;
      });
    }, []);

    const handleSelectAll = useCallback(() => {
      const allSelected = selectedCount === ingredients.length;
      setProcessedIngredients((prev) => {
        const newMap = new Map(prev);
        newMap.forEach((ingredient, id) => {
          newMap.set(id, { ...ingredient, isSelected: !allSelected });
        });
        return newMap;
      });
    }, [selectedCount, ingredients.length]);

    const handleAddToShoppingList = useCallback(async () => {
      try {
        const selectedIngredients = Array.from(
          processedIngredients.values()
        ).filter((ingredient) => ingredient.isSelected);

        await onAddToShoppingList(selectedIngredients);
      } catch (error) {
        handleError(error, "Add ingredients to shopping list");
      }
    }, [processedIngredients, onAddToShoppingList]);
    // Error state
    if (error) {
      return (
        <ErrorBoundary>
          <div className="flex h-full items-center justify-center">
            <div className="text-center py-6 space-y-3">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
              <div className="text-sm text-muted-foreground">
                Failed to generate enhanced shopping list. Please try again.
              </div>
              {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry}>
                  Retry
                </Button>
              )}
            </div>
          </div>
        </ErrorBoundary>
      );
    }

    // Loading state
    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center">
          <div
            className="flex items-center justify-center"
            role="status"
            aria-live="polite"
          >
            <LoadingSpinner size="lg" />
          </div>
        </div>
      );
    }

    // Empty state
    if (ingredients.length === 0) {
      return (
        <div className="flex h-full items-center justify-center">
          <p
            className="text-muted-foreground text-center py-6"
            role="status"
            aria-live="polite"
          >
            Add meals to your weekly plan to generate a shopping list
          </p>
        </div>
      );
    }

    return (
      <ErrorBoundary>
        <div className="flex flex-col gap-6 h-full overflow-hidden lg:flex-row">
          {/* Left Panel: New Ingredients */}
          <div className="flex flex-1 flex-col min-w-0 lg:max-h-full max-h-[50%]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">New Ingredients</h3>
                <Badge variant="secondary" className="text-xs">
                  {ingredients.length} items
                </Badge>
                {duplicateCount > 0 && (
                  <Badge className="bg-accent/20 text-accent border-accent/30 text-xs">
                    {duplicateCount} duplicates
                  </Badge>
                )}
              </div>
            </div>

            {/* Bulk Actions */}
            <div className="bg-muted/30 rounded-lg p-3 flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="flex items-center gap-2 bg-transparent"
              >
                {selectedCount === ingredients.length ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                {selectedCount === ingredients.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
              <span className="text-sm font-medium text-muted-foreground">
                {selectedCount} of {ingredients.length} selected
              </span>
            </div>

            {/* Ingredients List - Flexible height */}
            <div className="flex-1 min-h-0 mb-4">
              <ScrollArea className="h-full pr-2">
                <div className="space-y-2">
                  {ingredients.map((ingredient) => {
                    const processed = processedIngredients.get(ingredient.id);
                    if (!processed) return null;

                    return (
                      <IngredientCard
                        key={ingredient.id}
                        ingredient={ingredient}
                        isSelected={processed.isSelected}
                        onToggle={() => handleToggleSelection(ingredient.id)}
                        onQuantityChange={handleQuantityChange}
                        isDisabled={isAddingToList}
                      />
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            <Separator className="mb-4" />

            {/* Add to Shopping List Button - Fixed at bottom */}
            <Button
              onClick={handleAddToShoppingList}
              disabled={selectedCount === 0 || isAddingToList}
              className="w-full h-11"
              size="lg"
            >
              {isAddingToList ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Shopping List ({selectedCount})
                </>
              )}
            </Button>
          </div>

          {/* Right Panel: Existing Shopping List */}
          <div className="flex flex-1 flex-col min-w-0 lg:max-h-full max-h-[50%]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExistingCollapsed(!isExistingCollapsed)}
                  className="p-0 h-auto"
                >
                  {isExistingCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                <h3 className="text-lg font-semibold">Current Shopping List</h3>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex gap-2 flex-wrap mb-4">
              <Badge className="bg-primary/20 text-primary border-primary/30">
                {existingItems.length} total
              </Badge>
              <Badge className="bg-primary/20 text-primary border-primary/30">
                {existingItems.filter((i) => i.checked).length} checked
              </Badge>
              <Badge className="bg-accent/20 text-accent border-accent/30">
                {highlightedExistingItems.length} matches
              </Badge>
            </div>

            {/* Existing Items List - Flexible height */}
            {!isExistingCollapsed && (
              <div className="flex-1 min-h-0">
                <ScrollArea className="h-full pr-2">
                  <div className="space-y-2">
                    {existingItems.map((item, index) => (
                      <ExistingItemRow
                        key={item.id}
                        item={item}
                        isHighlighted={highlightedExistingItems.includes(index)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </div>
      </ErrorBoundary>
    );
  }
);

// Helper functions for duplicate handling
const getDuplicateIcon = (confidence: "high" | "medium" | "low") => {
  switch (confidence) {
    case "high":
      return <AlertTriangle className="h-3 w-3" />;
    case "medium":
      return <Info className="h-3 w-3" />;
    case "low":
      return <CheckCircle2 className="h-3 w-3" />;
  }
};

// Simple Ingredient Card Component matching the template
interface IngredientCardProps {
  ingredient: EnhancedParsedIngredient;
  isSelected: boolean;
  onToggle: () => void;
  onQuantityChange: (id: string, quantity: number) => void;
  isDisabled: boolean;
}

function IngredientCard({
  ingredient,
  isSelected,
  onToggle,
  onQuantityChange: _onQuantityChange,
  isDisabled: _isDisabled,
}: IngredientCardProps) {
  // Get primary duplicate for display
  const primaryDuplicate =
    ingredient.duplicateMatches.length > 0
      ? ingredient.duplicateMatches[0]
      : null;

  const isDuplicate = primaryDuplicate !== null;
  const duplicateConfidence = primaryDuplicate?.matchConfidence ?? null;

  return (
    <div
      className={cn(
        "p-3 border rounded-md transition-colors",
        isSelected
          ? "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800"
          : "bg-background border-border hover:bg-muted/50",
        isDuplicate &&
          duplicateConfidence === "high" &&
          "bg-destructive/10 border-destructive/20",
        isDuplicate &&
          duplicateConfidence === "medium" &&
          "bg-primary/10 border-primary/20",
        isDuplicate &&
          duplicateConfidence === "low" &&
          "bg-muted/50 border-muted"
      )}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
    >
      <div className="flex items-start gap-3">
        {/* Selection checkbox */}
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggle}
          disabled={_isDisabled}
          className="mt-0.5"
        />

        <div className="flex-1 min-w-0 space-y-2">
          {/* Main ingredient display */}
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-foreground">
              {ingredient.name}
            </span>

            {/* Duplicate indicator */}
            {isDuplicate && duplicateConfidence && (
              <Badge
                variant="outline"
                className="text-xs"
                title={`${duplicateConfidence} confidence duplicate match`}
              >
                {getDuplicateIcon(duplicateConfidence)}
                Duplicate
              </Badge>
            )}
          </div>

          {/* Source recipes */}
          {ingredient.sourceRecipes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {ingredient.sourceRecipes.slice(0, 2).map((source) => (
                <Badge
                  key={source.recipeId}
                  variant="secondary"
                  className="text-xs bg-muted text-muted-foreground"
                >
                  {source.recipeName}
                </Badge>
              ))}
              {ingredient.sourceRecipes.length > 2 && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-muted text-muted-foreground"
                >
                  +{ingredient.sourceRecipes.length - 2} more
                </Badge>
              )}
            </div>
          )}

          {/* Quantity */}
          <div className="text-sm text-muted-foreground">
            Quantity: {ingredient.quantity ?? 1}
          </div>
        </div>
      </div>
    </div>
  );
}

// Existing item row component
interface ExistingItemRowProps {
  item: ShoppingItem;
  isHighlighted: boolean;
}

function ExistingItemRow({ item, isHighlighted }: ExistingItemRowProps) {
  return (
    <div
      className={cn(
        "p-3 rounded-md border transition-colors",
        isHighlighted
          ? "bg-accent/10 border-accent/30"
          : "bg-card border-border hover:bg-muted/50"
      )}
    >
      <div className="flex items-center gap-3">
        <Checkbox checked={item.checked} disabled />
        <span
          className={cn(
            "flex-1",
            item.checked && "line-through text-muted-foreground"
          )}
        >
          {item.name}
        </span>
        <div className="flex gap-2">
          <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
            Shopping List
          </Badge>
          {isHighlighted && (
            <Badge className="bg-accent/20 text-accent border-accent/30 text-xs">
              Match
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

export { EnhancedGeneratedShoppingList };
