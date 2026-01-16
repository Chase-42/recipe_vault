"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  ExternalLink,
  ChefHat,
  Edit,
  ShoppingCart,
  GripVertical,
  GripHorizontal,
  Check,
} from "lucide-react";
import { IconHeart } from "@tabler/icons-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PageTransition } from "~/components/ui/page-transition";
import { Button } from "~/components/ui/button";
import { TopNav } from "~/app/_components/topnav";
import { Checkbox } from "~/components/ui/checkbox";
import { Badge } from "~/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { AddToListModal } from "~/components/shopping-lists/AddToListModal";
import { useFavoriteToggle } from "~/hooks/useFavoriteToggle";
import { useRecipeProgress } from "~/hooks/useRecipeProgress";
import type { Recipe } from "~/types";
import { cn } from "~/lib/utils";
import { fetchRecipe } from "~/utils/recipeService";
import { recipeKey } from "~/utils/query-keys";
import LoadingSpinner from "./LoadingSpinner";

// Constants for resizable panels
const MIN_PANEL_SIZE = 20;
const MAX_PANEL_SIZE = 80;
const DEFAULT_LEFT_PANEL_WIDTH = 45;
const DEFAULT_IMAGE_HEIGHT = 50;

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
  const router = useRouter();
  const [showAddToList, setShowAddToList] = useState(false);
  const { toggleFavorite } = useFavoriteToggle();
  
  // Use localStorage hook for persistence (will be initialized from localStorage)
  const {
    checkedIngredients,
    checkedInstructions,
    setCheckedIngredients,
    setCheckedInstructions,
  } = useRecipeProgress(id);

  // Resizable panel states
  const [leftPanelWidth, setLeftPanelWidth] = useState(DEFAULT_LEFT_PANEL_WIDTH);
  const [imageHeight, setImageHeight] = useState(DEFAULT_IMAGE_HEIGHT);
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);
  const [isDraggingVertical, setIsDraggingVertical] = useState(false);

  const horizontalDividerRef = useRef<HTMLDivElement>(null);
  const verticalDividerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();
  const cachedData = queryClient.getQueryData<Recipe>(recipeKey(id));
  const hasCachedData = !!cachedData;

  const { data: recipe, error, isLoading } = useQuery<Recipe>({
    queryKey: recipeKey(id),
    queryFn: () => fetchRecipe(id),
    initialData: cachedData ?? initialRecipe ?? undefined,
    placeholderData: cachedData ?? initialRecipe ?? undefined,
    gcTime: 1000 * 60 * 30, // 30 minutes (longer than default for recipe data)
    refetchOnMount: !hasCachedData,
  });

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

  const displayRecipe = recipe ?? cachedData ?? initialRecipe;

  if (isLoading && !displayRecipe) {
    if (loadingFallback) {
      return <>{loadingFallback}</>;
    }
    return (
      <div className="flex h-full w-full flex-col">
        <TopNav
          showBackButton
          showSearch={false}
          showActions={false}
          centerContent={<h1 className="text-xl font-semibold">Loading Recipe...</h1>}
        />
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex min-h-[60vh] items-center justify-center">
            <LoadingSpinner size="md" fullHeight={false} />
          </div>
        </div>
      </div>
    );
  }

  if (error && !displayRecipe) {
    return (
      <div className="flex h-full w-full flex-col">
        <TopNav
          showBackButton
          showSearch={false}
          showActions={false}
          centerContent={<h1 className="text-xl font-semibold">Error</h1>}
        />
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-xl">Failed to load recipe.</div>
          </div>
        </div>
      </div>
    );
  }

  if (!displayRecipe) {
    return (
      <div className="flex h-full w-full flex-col">
        <TopNav
          showBackButton
          showSearch={false}
          showActions={false}
          centerContent={<h1 className="text-xl font-semibold">Not Found</h1>}
        />
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-xl">Recipe not found.</div>
          </div>
        </div>
      </div>
    );
  }

  const ingredients = displayRecipe.ingredients
    .split("\n")
    .filter((line) => line.trim() !== "");
  const instructions = displayRecipe.instructions
    .split("\n")
    .filter((line) => line.trim() !== "");

  return (
    <PageTransition>
      <div className="h-screen w-full">
        <TopNav
          showBackButton
          showSearch={false}
          showActions={false}
          centerContent={
            <div className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold text-white">
                {displayRecipe.name}
              </h1>
            </div>
          }
          rightContent={
            <TooltipProvider>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/edit/${displayRecipe.id}`)}
                      className="h-8 w-8 text-white hover:bg-zinc-800"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit Recipe</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowAddToList(true)}
                      className="h-8 w-8 text-white hover:bg-zinc-800"
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add to Shopping List</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFavorite(displayRecipe)}
                      className="h-8 w-8 text-white hover:bg-zinc-800"
                    >
                      <IconHeart
                        size={16}
                        className={cn(
                          "transition-colors duration-300",
                          displayRecipe.favorite
                            ? "text-destructive fill-current"
                            : "text-white"
                        )}
                        strokeWidth={2}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {displayRecipe.favorite ? "Remove from Favorites" : "Add to Favorites"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          }
        />

        {/* Main Content */}
        <div ref={containerRef} className="flex h-[calc(100vh-7rem)] relative">
          {/* Left Panel */}
          <div
            ref={leftPanelRef}
            className="flex flex-col border-r border-border relative"
            style={{ width: `${leftPanelWidth}%` }}
          >
            {/* Image Section */}
            <div
              className="relative overflow-hidden"
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
              className="flex flex-col min-h-0 flex-1 p-4 overflow-hidden bg-black/40"
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
            className="flex-1 overflow-hidden"
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
          {displayRecipe.link && (
            <Button
              variant="ghost"
              className="text-sm h-8 text-white hover:bg-zinc-800"
              onClick={() => window.open(displayRecipe.link, "_blank")}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              View Original Recipe
            </Button>
          )}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => window.print()}
              className="text-sm h-8 text-white hover:bg-zinc-800"
            >
              Print Recipe
            </Button>
            <Button
              onClick={() => setShowAddToList(true)}
              className="text-sm h-8 text-white hover:bg-zinc-800"
            >
              Add to Shopping List
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
    </PageTransition>
  );
}
