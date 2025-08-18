"use client";

import { useRef, memo, useCallback, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Search, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import type { Recipe, Category } from "~/types";

interface RecipePanelProps {
  recipes: Recipe[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory: Category;
  onCategoryChange: (category: Category) => void;
  onRecipeDragStart: (recipe: Recipe) => void;
  onRecipeDragEnd: () => void;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

interface DraggableRecipeCardProps {
  recipe: Recipe;
  onDragStart: (recipe: Recipe) => void;
  onDragEnd: () => void;
}

const DraggableRecipeCard = memo(
  ({ recipe, onDragStart, onDragEnd }: DraggableRecipeCardProps) => {
    const handleDragStart = useCallback(
      (e: React.DragEvent) => {
        onDragStart(recipe);
        e.dataTransfer.setData("application/json", JSON.stringify(recipe));
      },
      [recipe, onDragStart]
    );

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        // For keyboard users, we could trigger a different interaction
        // For now, we'll just focus on the first available meal slot
        const firstEmptySlot = document.querySelector(
          '[data-meal-slot="true"]:not([aria-label*="scheduled"])'
        );
        if (firstEmptySlot && "focus" in firstEmptySlot) {
          (firstEmptySlot as HTMLElement).focus();
          // Could also trigger a selection mode here
        }
      }
    }, []);

    return (
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        className="p-3 border rounded-lg cursor-move hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        role="button"
        tabIndex={0}
        aria-label={`${recipe.name}. Categories: ${recipe.categories.join(", ")}. Drag to schedule or press Enter to select.`}
        aria-describedby={`recipe-${recipe.id}-description`}
        onKeyDown={handleKeyDown}
      >
        <div className="font-medium text-sm">{recipe.name}</div>
        <div className="text-xs text-gray-500 truncate">
          {recipe.categories.join(", ")}
        </div>
        <div id={`recipe-${recipe.id}-description`} className="sr-only">
          Recipe with categories: {recipe.categories.join(", ")}. Use drag and
          drop to schedule this recipe, or use keyboard navigation to select a
          meal slot.
        </div>
      </div>
    );
  }
);

DraggableRecipeCard.displayName = "DraggableRecipeCard";

export const RecipePanel = memo(function RecipePanel({
  recipes,
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onRecipeDragStart,
  onRecipeDragEnd,
  isLoading = false,
  error = null,
  onRetry,
}: RecipePanelProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Filter recipes based on search and category - memoized for performance
  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      const matchesSearch =
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.ingredients.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" ||
        recipe.categories.includes(selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [recipes, searchTerm, selectedCategory]);

  // Set up virtualization for large recipe collections
  const virtualizer = useVirtualizer({
    count: filteredRecipes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated recipe card height
    overscan: 5,
  });

  // Error state
  if (error) {
    return (
      <ErrorBoundary>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Recipes
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </ErrorBoundary>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Recipes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-2">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            <div>Loading recipes...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ErrorBoundary>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Recipes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="space-y-2">
            <label
              htmlFor="recipe-search"
              className="text-sm font-medium sr-only"
            >
              Search recipes
            </label>
            <Input
              id="recipe-search"
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full"
              aria-describedby="search-help"
            />
            <div id="search-help" className="sr-only">
              Search by recipe name or ingredients
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="category-filter"
              className="text-sm font-medium sr-only"
            >
              Filter by category
            </label>
            <Select
              value={selectedCategory}
              onValueChange={(value) => onCategoryChange(value as Category)}
            >
              <SelectTrigger aria-label="Filter recipes by category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                <SelectItem value="Breakfast">Breakfast</SelectItem>
                <SelectItem value="Lunch">Lunch</SelectItem>
                <SelectItem value="Dinner">Dinner</SelectItem>
                <SelectItem value="Dessert">Dessert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Virtualized Recipe List */}
          <div
            ref={parentRef}
            className="max-h-96 overflow-auto"
            style={{ height: "384px" }} // Fixed height for virtualization
            role="listbox"
            aria-label="Available recipes"
            aria-describedby="recipe-list-help"
          >
            <div id="recipe-list-help" className="sr-only">
              List of available recipes. Use arrow keys to navigate, Enter to
              select a recipe for scheduling.
            </div>
            {filteredRecipes.length === 0 ? (
              <div
                className="text-center py-8 text-gray-500"
                role="status"
                aria-live="polite"
              >
                No recipes found matching your criteria
              </div>
            ) : (
              <div
                style={{
                  height: virtualizer.getTotalSize(),
                  width: "100%",
                  position: "relative",
                }}
              >
                {virtualizer.getVirtualItems().map((virtualItem) => {
                  const recipe = filteredRecipes[virtualItem.index];
                  if (!recipe) return null;

                  return (
                    <div
                      key={virtualItem.key}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      <div className="pr-2 pb-2">
                        <DraggableRecipeCard
                          recipe={recipe}
                          onDragStart={onRecipeDragStart}
                          onDragEnd={onRecipeDragEnd}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recipe count indicator */}
          <div
            className="text-xs text-gray-500 text-center"
            role="status"
            aria-live="polite"
            aria-label={`${filteredRecipes.length} recipe${filteredRecipes.length !== 1 ? "s" : ""} ${searchTerm || selectedCategory !== "All" ? "found" : "available"}`}
          >
            {filteredRecipes.length} recipe
            {filteredRecipes.length !== 1 ? "s" : ""}{" "}
            {searchTerm || selectedCategory !== "All" ? "found" : "available"}
          </div>
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
});
