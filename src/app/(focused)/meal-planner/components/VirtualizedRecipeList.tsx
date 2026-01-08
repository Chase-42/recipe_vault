"use client";

import { useRef, memo, useCallback, useMemo } from "react";
import { FixedSizeList as List } from "react-window";
import Image from "next/image";
import { AlertCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import type { Recipe, MealType } from "~/types";

// HSL color system for meal types
const mealTypeColors = {
  breakfast: "hsl(25, 70%, 50%)", // Orange
  lunch: "hsl(210, 70%, 50%)", // Blue
  dinner: "hsl(270, 70%, 50%)", // Purple
} as const;

interface VirtualizedRecipeListProps {
  recipes: Recipe[];
  onRecipeDragStart: (recipe: Recipe) => void;
  onRecipeDragEnd: () => void;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  height?: number;
}

interface RecipeItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    recipes: Recipe[];
    onRecipeDragStart: (recipe: Recipe) => void;
    onRecipeDragEnd: () => void;
  };
}

// Memoized recipe item component for virtualization
const RecipeItem = memo(({ index, style, data }: RecipeItemProps) => {
  const { recipes, onRecipeDragStart, onRecipeDragEnd } = data;
  const recipe = recipes[index];

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      if (recipe) {
        onRecipeDragStart(recipe);
        e.dataTransfer.setData("application/json", JSON.stringify(recipe));
      }
    },
    [recipe, onRecipeDragStart]
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      // For keyboard users, focus on the first available meal slot
      const firstEmptySlot = document.querySelector(
        '[data-meal-slot="true"]:not([aria-label*="scheduled"])'
      );
      if (firstEmptySlot && "focus" in firstEmptySlot) {
        (firstEmptySlot as HTMLElement).focus();
      }
    }
  }, []);

  if (!recipe) {
    return <div style={style} />;
  }

  return (
    <div style={style} className="px-2 pb-2">
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={onRecipeDragEnd}
        className="p-3 bg-card rounded-lg border cursor-grab active:cursor-grabbing hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        role="button"
        tabIndex={0}
        aria-label={`${recipe.name}. Categories: ${recipe.categories.join(", ")}. Drag to schedule or press Enter to select.`}
        aria-describedby={`recipe-${recipe.id}-description`}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
            <Image
              src={recipe.imageUrl}
              alt={recipe.name}
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{recipe.name}</h3>
            <div className="flex flex-wrap gap-1 mt-1">
              {recipe.categories.slice(0, 2).map((category) => (
                <span
                  key={category}
                  className="text-xs px-2 py-0.5 rounded-full text-white"
                  style={{
                    backgroundColor:
                      mealTypeColors[category.toLowerCase() as MealType] ||
                      "hsl(var(--muted))",
                  }}
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div id={`recipe-${recipe.id}-description`} className="sr-only">
          Recipe with categories: {recipe.categories.join(", ")}. Use drag and
          drop to schedule this recipe, or use keyboard navigation to select a
          meal slot.
        </div>
      </div>
    </div>
  );
});

RecipeItem.displayName = "RecipeItem";

export const VirtualizedRecipeList = memo(function VirtualizedRecipeList({
  recipes,
  onRecipeDragStart,
  onRecipeDragEnd,
  isLoading = false,
  error = null,
  onRetry,
  height = 400,
}: VirtualizedRecipeListProps) {
  const listRef = useRef<List>(null);

  // Memoize the data object to prevent unnecessary re-renders
  const itemData = useMemo(
    () => ({
      recipes,
      onRecipeDragStart,
      onRecipeDragEnd,
    }),
    [recipes, onRecipeDragStart, onRecipeDragEnd]
  );

  // Error state
  if (error) {
    return (
      <div className="text-center py-8 space-y-4">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
        <div className="text-sm text-muted-foreground">
          Failed to load recipes. Please try again.
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  // Empty state
  if (recipes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No recipes found matching your criteria
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div
        role="listbox"
        aria-label="Available recipes"
        aria-describedby="recipe-list-help"
      >
        <div id="recipe-list-help" className="sr-only">
          List of available recipes. Use arrow keys to navigate, Enter to select
          a recipe for scheduling.
        </div>
        <List
          ref={listRef}
          height={height}
          width="100%"
          itemCount={recipes.length}
          itemSize={80} // Height of each recipe item
          itemData={itemData}
          overscanCount={5} // Render 5 extra items outside visible area
        >
          {RecipeItem}
        </List>

        {/* Recipe count indicator */}
        <div
          className="text-xs text-gray-500 text-center mt-2"
          role="status"
          aria-live="polite"
          aria-label={`${recipes.length} recipe${recipes.length !== 1 ? "s" : ""} available`}
        >
          {recipes.length} recipe{recipes.length !== 1 ? "s" : ""} available
        </div>
      </div>
    </ErrorBoundary>
  );
});
