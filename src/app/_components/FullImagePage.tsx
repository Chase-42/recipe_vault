"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  ExternalLink,
  ShoppingCart,
  GripVertical,
  GripHorizontal,
  Check,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Badge } from "~/components/ui/badge";
import { AddToListModal } from "~/components/shopping-lists/AddToListModal";
import { useRecipeProgress } from "~/hooks/useRecipeProgress";
import { useHeaderContext } from "~/providers/HeaderContext";
import type { Recipe } from "~/types";
import { cn } from "~/lib/utils";
import { fetchRecipe } from "~/utils/recipeService";
import { recipeKey } from "~/utils/query-keys";
import LoadingSpinner from "./LoadingSpinner";

// Constants for resizable panels
const MIN_PANEL_SIZE = 20;
const MAX_PANEL_SIZE = 55;
const DEFAULT_LEFT_PANEL_WIDTH = 38;
const DEFAULT_IMAGE_HEIGHT = 40;

// Helper to toggle an item in a Set
const toggleSetItem = <T,>(set: Set<T>, item: T): Set<T> => {
  const newSet = new Set(set);
  if (newSet.has(item)) {
    newSet.delete(item);
  } else {
    newSet.add(item);
  }
  return newSet;
};

// Helper for keyboard event handling
const handleKeyboardToggle = (
  e: React.KeyboardEvent,
  callback: () => void
) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    callback();
  }
};

interface FullPageImageViewProps {
  id: number;
  initialRecipe?: Recipe | null;
  loadingFallback?: React.ReactNode;
}

export default function FullImageView({
  id,
  initialRecipe,
  loadingFallback,
}: FullPageImageViewProps) {
  const [showAddToList, setShowAddToList] = useState(false);
  const { setRecipeData } = useHeaderContext();

  // Use localStorage hook for persistence (will be initialized from localStorage)
  const {
    checkedIngredients,
    checkedInstructions,
    setCheckedIngredients,
    setCheckedInstructions,
  } = useRecipeProgress(id);

  const queryClient = useQueryClient();
  const cachedData = queryClient.getQueryData<Recipe>(recipeKey(id));
  const hasData = !!(cachedData ?? initialRecipe);

  // Resizable panel states
  const [leftPanelWidth, setLeftPanelWidth] = useState(DEFAULT_LEFT_PANEL_WIDTH);
  const [imageHeight, setImageHeight] = useState(DEFAULT_IMAGE_HEIGHT);
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);
  const [isDraggingVertical, setIsDraggingVertical] = useState(false);

  const horizontalDividerRef = useRef<HTMLDivElement>(null);
  const verticalDividerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  const { data: recipe, error, isLoading } = useQuery<Recipe>({
    queryKey: recipeKey(id),
    queryFn: () => fetchRecipe(id),
    initialData: cachedData ?? initialRecipe ?? undefined,
    gcTime: 1000 * 60 * 30,
    staleTime: 1000 * 60 * 5,
    refetchOnMount: !hasData,
  });

  const displayRecipe = recipe ?? cachedData ?? initialRecipe;

  const recipeId = displayRecipe?.id;
  const recipeName = displayRecipe?.name;
  const recipeFavorite = displayRecipe?.favorite;

  // Set recipe data in header context
  useEffect(() => {
    if (recipeId !== undefined && recipeName !== undefined) {
      setRecipeData({
        id: recipeId,
        name: recipeName,
        favorite: recipeFavorite ?? false,
      });
    }
    return () => setRecipeData(null);
  }, [recipeId, recipeName, recipeFavorite, setRecipeData]);

  const toggleIngredient = useCallback(
    (index: number) => {
      setCheckedIngredients(toggleSetItem(checkedIngredients, index));
    },
    [checkedIngredients, setCheckedIngredients]
  );

  const toggleInstruction = useCallback(
    (index: number) => {
      setCheckedInstructions(toggleSetItem(checkedInstructions, index));
    },
    [checkedInstructions, setCheckedInstructions]
  );

  // Horizontal divider handlers (left/right split)
  const handleHorizontalStart = useCallback(() => {
    setIsDraggingHorizontal(true);
  }, []);

  const handleHorizontalMove = useCallback(
    (clientX: number) => {
      if (!isDraggingHorizontal || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = ((clientX - rect.left) / rect.width) * 100;
      const constrainedWidth = Math.max(
        MIN_PANEL_SIZE,
        Math.min(MAX_PANEL_SIZE, newWidth)
      );
      setLeftPanelWidth(constrainedWidth);
    },
    [isDraggingHorizontal]
  );

  const handleHorizontalEnd = useCallback(() => {
    setIsDraggingHorizontal(false);
  }, []);

  // Vertical divider handlers (image/ingredients split)
  const handleVerticalStart = useCallback(() => {
    setIsDraggingVertical(true);
  }, []);

  const handleVerticalMove = useCallback(
    (clientY: number) => {
      if (!isDraggingVertical || !leftPanelRef.current) return;
      const rect = leftPanelRef.current.getBoundingClientRect();
      const newHeight = ((clientY - rect.top) / rect.height) * 100;
      const constrainedHeight = Math.max(
        MIN_PANEL_SIZE,
        Math.min(MAX_PANEL_SIZE, newHeight)
      );
      setImageHeight(constrainedHeight);
    },
    [isDraggingVertical]
  );

  const handleVerticalEnd = useCallback(() => {
    setIsDraggingVertical(false);
  }, []);

  // Unified mouse handlers
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDraggingHorizontal) {
        handleHorizontalMove(e.clientX);
      } else if (isDraggingVertical) {
        handleVerticalMove(e.clientY);
      }
    },
    [
      isDraggingHorizontal,
      isDraggingVertical,
      handleHorizontalMove,
      handleVerticalMove,
    ]
  );

  const handleMouseUp = useCallback(() => {
    if (isDraggingHorizontal) {
      handleHorizontalEnd();
    } else if (isDraggingVertical) {
      handleVerticalEnd();
    }
  }, [
    isDraggingHorizontal,
    isDraggingVertical,
    handleHorizontalEnd,
    handleVerticalEnd,
  ]);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (horizontalDividerRef.current?.contains(e.target as Node)) {
        e.preventDefault();
        handleHorizontalStart();
      } else if (verticalDividerRef.current?.contains(e.target as Node)) {
        e.preventDefault();
        handleVerticalStart();
      }
    },
    [handleHorizontalStart, handleVerticalStart]
  );

  // Unified touch handlers
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;

      if (isDraggingHorizontal) {
        e.preventDefault();
        handleHorizontalMove(touch.clientX);
      } else if (isDraggingVertical) {
        e.preventDefault();
        handleVerticalMove(touch.clientY);
      }
    },
    [
      isDraggingHorizontal,
      isDraggingVertical,
      handleHorizontalMove,
      handleVerticalMove,
    ]
  );

  const handleTouchEnd = useCallback(() => {
    if (isDraggingHorizontal) {
      handleHorizontalEnd();
    } else if (isDraggingVertical) {
      handleVerticalEnd();
    }
  }, [
    isDraggingHorizontal,
    isDraggingVertical,
    handleHorizontalEnd,
    handleVerticalEnd,
  ]);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;

      if (horizontalDividerRef.current?.contains(e.target as Node)) {
        e.preventDefault();
        handleHorizontalStart();
      } else if (verticalDividerRef.current?.contains(e.target as Node)) {
        e.preventDefault();
        handleVerticalStart();
      }
    },
    [handleHorizontalStart, handleVerticalStart]
  );

  // Event listeners for dragging
  useEffect(() => {
    if (isDraggingHorizontal || isDraggingVertical) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [
    isDraggingHorizontal,
    isDraggingVertical,
    handleMouseMove,
    handleMouseUp,
    handleTouchMove,
    handleTouchEnd,
  ]);

  // Event listeners for drag start
  useEffect(() => {
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("touchstart", handleTouchStart);
    };
  }, [handleMouseDown, handleTouchStart]);

  if (isLoading && !displayRecipe) {
    if (loadingFallback) {
      return <>{loadingFallback}</>;
    }
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" fullHeight={false} />
      </div>
    );
  }

  if (error && !displayRecipe) {
    return <div>Failed to load recipe.</div>;
  }

  if (!displayRecipe) {
    return <div>Recipe not found.</div>;
  }

  const ingredients = displayRecipe.ingredients
    .split("\n")
    .filter((line) => line.trim() !== "");
  const instructions = displayRecipe.instructions
    .split("\n")
    .filter((line) => line.trim() !== "");

  return (
    <div className="h-screen w-full">
        {/* Main Content */}
        <div ref={containerRef} className="flex h-[calc(100vh-3.5rem)] relative">
          {/* Left Panel */}
          <div
            ref={leftPanelRef}
            className={cn(
              "flex flex-col border-r border-border relative",
              !isDraggingHorizontal && "transition-[width] duration-150 ease-out"
            )}
            style={{ width: `${leftPanelWidth}%` }}
          >
            {/* Image Section */}
            <div
              className={cn(
                "relative overflow-hidden",
                !isDraggingVertical && "transition-[height] duration-150 ease-out"
              )}
              style={{ height: `${imageHeight}%` }}
            >
              <Image
                src={displayRecipe.imageUrl}
                alt={`Image of ${displayRecipe.name}`}
                fill
                priority
                sizes={`${leftPanelWidth}vw`}
                className="object-cover"
              />
            </div>

            {/* Vertical Divider */}
            <div
              ref={verticalDividerRef}
              className={cn(
                "h-1 bg-border hover:bg-primary/50 cursor-row-resize transition-colors relative z-10 flex items-center justify-center",
                isDraggingVertical && "bg-primary"
              )}
              style={{ userSelect: "none" }}
            >
              <div className="absolute inset-x-0 -top-2 -bottom-2" />
              <GripHorizontal className="h-3 w-3 text-muted-foreground" />
            </div>

            {/* Ingredients Section */}
            <div
              className={cn(
                "flex flex-col min-h-0 flex-1 p-4 overflow-hidden bg-black/40",
                !isDraggingVertical && "transition-[height] duration-150 ease-out"
              )}
              style={{ height: `${100 - imageHeight}%` }}
            >
              {displayRecipe.tags && displayRecipe.tags.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {displayRecipe.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-lg font-semibold text-foreground">
                  Ingredients
                </h2>
                <Badge variant="outline">{ingredients.length}</Badge>
              </div>
              <div className="overflow-y-auto min-h-0 flex-1 space-y-2.5">
                {ingredients.map((ingredient, index) => {
                  const key = `ingredient-${index}-${ingredient.trim().toLowerCase().replace(/\s+/g, "-")}`;
                  const isChecked = checkedIngredients.has(index);
                  return (
                    <div key={key} className="flex items-start gap-2">
                      <Checkbox
                        id={key}
                        checked={isChecked}
                        onCheckedChange={() => toggleIngredient(index)}
                      />
                      <label
                        htmlFor={key}
                        className={cn(
                          "text-sm leading-relaxed cursor-pointer",
                          isChecked
                            ? "line-through text-muted-foreground"
                            : "text-foreground"
                        )}
                      >
                        {ingredient}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Horizontal Divider */}
          <div
            ref={horizontalDividerRef}
            className={cn(
              "w-1 bg-border hover:bg-primary/50 cursor-col-resize transition-colors relative z-10 flex items-center justify-center",
              isDraggingHorizontal && "bg-primary"
            )}
            style={{ userSelect: "none" }}
          >
            <div className="absolute inset-y-0 -left-2 -right-2" />
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>

          {/* Right Panel (Instructions) */}
          <div
            className={cn(
              "flex-1 overflow-hidden",
              !isDraggingHorizontal && "transition-[width] duration-150 ease-out"
            )}
            style={{ width: `${100 - leftPanelWidth}%` }}
          >
            <div className="p-4 h-full overflow-y-auto bg-black/40">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-lg font-semibold text-foreground">
                  Instructions
                </h2>
                <Badge variant="outline">{instructions.length} steps</Badge>
              </div>
              <div className="space-y-4">
                {instructions.map((instruction, index) => {
                  const key = `instruction-${index}-${instruction.trim().toLowerCase().slice(0, 32).replace(/\s+/g, "-")}`;
                  const isChecked = checkedInstructions.has(index);
                  const handleToggle = () => toggleInstruction(index);
                  return (
                    <div key={key} className="flex gap-3 items-start">
                      <button
                        type="button"
                        onClick={handleToggle}
                        onKeyDown={(e) => handleKeyboardToggle(e, handleToggle)}
                        className={cn(
                          "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95",
                          isChecked
                            ? "bg-green-600 text-white"
                            : "bg-primary text-primary-foreground hover:bg-primary/80"
                        )}
                        aria-label={`Mark step ${index + 1} as ${isChecked ? "incomplete" : "complete"}`}
                      >
                        {isChecked ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          index + 1
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleToggle}
                        onKeyDown={(e) => handleKeyboardToggle(e, handleToggle)}
                        className={cn(
                          "text-sm leading-relaxed flex-1 cursor-pointer text-left",
                          isChecked
                            ? "line-through text-muted-foreground"
                            : "text-foreground/90"
                        )}
                      >
                        {instruction}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-14 px-4 border-t border-border bg-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            {displayRecipe.link && (
              <Button
                variant="ghost"
                className="text-sm h-8 text-white hover:bg-zinc-800"
                onClick={() => window.open(displayRecipe.link, "_blank")}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                View Original
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => window.print()}
              className="text-sm h-8 text-white hover:bg-zinc-800"
            >
              Print
            </Button>
            <Button
              onClick={() => setShowAddToList(true)}
              className="text-sm h-8"
            >
              <ShoppingCart className="h-4 w-4 mr-1.5" />
              Add to List
            </Button>
          </div>
        </div>

        <AddToListModal
          isOpen={showAddToList}
          onClose={() => setShowAddToList(false)}
          ingredients={ingredients}
          recipeId={displayRecipe.id}
          recipeName={displayRecipe.name}
        />
    </div>
  );
}
