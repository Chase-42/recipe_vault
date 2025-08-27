"use client";

import { useState } from "react";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { RecipeDetailModal } from "./RecipeDetailModal";
import { logger } from "~/lib/logger";
import type { MealSlotProps, Recipe, MealType } from "~/types";

// Drag states for visual feedback
type DragState = "idle" | "dragOver" | "canDrop" | "cannotDrop";

export function MealSlot({
  date,
  mealType,
  plannedMeal,
  onDrop,
  onRemove,
  isDragOver: _isDragOver = false,
  canDrop = true,
  isMobile = false,
  gridRow,
  gridCol,
}: MealSlotProps) {
  const [dragState, setDragState] = useState<DragState>("idle");
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showRecipeDetail, setShowRecipeDetail] = useState(false);

  // Handle drag over event
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Only show drag feedback if we can accept the drop
    if (canDrop) {
      setDragState("canDrop");
    } else {
      setDragState("cannotDrop");
    }
  };

  // Handle drag enter event
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (canDrop) {
      setDragState("canDrop");
    } else {
      setDragState("cannotDrop");
    }
  };

  // Handle drag leave event
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Only reset drag state if we're actually leaving the element
    // Check if the related target is not a child of this element
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragState("idle");
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setDragState("idle");

    if (!canDrop) {
      return;
    }

    try {
      // Get the dragged recipe data
      const recipeData = e.dataTransfer.getData("application/json");
      if (recipeData) {
        const recipe: Recipe = JSON.parse(recipeData) as Recipe;
        onDrop(recipe, date, mealType);
      }
    } catch (error) {
      logger.error("Error parsing dropped recipe data", { error });
    }
  };

  // Handle meal removal with confirmation (used in AlertDialog)
  const handleRemoveClick = () => {
    setShowRemoveDialog(true);
  };

  const handleConfirmRemove = () => {
    if (plannedMeal) {
      onRemove(plannedMeal);
    }
    setShowRemoveDialog(false);
  };

  // Handle recipe detail viewing
  const handleViewRecipe = () => {
    setShowRecipeDetail(true);
  };

  // Get CSS classes based on drag state
  const getDragStateClasses = (): string => {
    const baseClasses = "transition-all duration-200 border-2 border-dashed";

    switch (dragState) {
      case "canDrop":
        return `${baseClasses} border-green-500 bg-green-50 dark:bg-green-900/20`;
      case "cannotDrop":
        return `${baseClasses} border-red-500 bg-red-50 dark:bg-red-900/20`;
      case "dragOver":
        return `${baseClasses} border-blue-500 bg-blue-50 dark:bg-blue-900/20`;
      default:
        return `${baseClasses} border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500`;
    }
  };

  // Format meal type for display
  const formatMealType = (type: MealType): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const isEmpty = !plannedMeal;

  return (
    <div
      className={`
        bg-gray-50 dark:bg-gray-700 rounded-md p-3 
        ${isMobile ? "min-h-[120px] min-w-[140px] flex-shrink-0" : "min-h-[80px]"}
        ${getDragStateClasses()}
        ${isEmpty ? "hover:bg-gray-100 dark:hover:bg-gray-650" : ""}
      `}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="gridcell"
      tabIndex={0}
      aria-label={
        isEmpty
          ? `Empty ${formatMealType(mealType)} slot for ${new Date(date).toLocaleDateString()}. Press Enter to add a meal.`
          : `${plannedMeal.recipe?.name} scheduled for ${formatMealType(mealType)} on ${new Date(date).toLocaleDateString()}. Press Enter to view details or Delete to remove.`
      }
      aria-dropeffect={canDrop ? "move" : "none"}
      aria-describedby={`meal-slot-${date}-${mealType}-description`}
      data-meal-slot="true"
      data-date={date}
      data-meal-type={mealType}
      {...(gridRow !== undefined && gridCol !== undefined && !isMobile
        ? {
            "data-grid-row": gridRow.toString(),
            "data-grid-col": gridCol.toString(),
          }
        : {})}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (isEmpty) {
            // Could trigger a recipe selection modal
          } else {
            handleViewRecipe();
          }
        } else if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          if (!isEmpty) {
            handleRemoveClick();
          }
        }
      }}
    >
      {/* Meal Type Label */}
      <div
        className={`text-gray-600 dark:text-gray-300 font-medium capitalize mb-2 ${
          isMobile ? "text-sm" : "text-xs"
        }`}
      >
        {formatMealType(mealType)}
      </div>

      {/* Screen reader description */}
      <div id={`meal-slot-${date}-${mealType}-description`} className="sr-only">
        {isEmpty
          ? `Empty meal slot. Drag a recipe here or press Enter to add a meal.`
          : `Contains ${plannedMeal.recipe?.name}. Press Enter to view details, Delete to remove.`}
      </div>

      {/* Meal Content */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <div className="text-gray-400 dark:text-gray-500 text-sm mb-1">
            {dragState === "canDrop" ? "Drop recipe here" : "Empty"}
          </div>
          {dragState === "canDrop" && (
            <div className="text-green-600 dark:text-green-400 text-xs">
              ✓ Ready to add meal
            </div>
          )}
          {dragState === "cannotDrop" && (
            <div className="text-red-600 dark:text-red-400 text-xs">
              ✗ Cannot drop here
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Recipe Image */}
          {plannedMeal.recipe?.imageUrl && (
            <div
              className={`relative w-full rounded overflow-hidden ${
                isMobile ? "h-20" : "h-16"
              }`}
            >
              <Image
                src={plannedMeal.recipe.imageUrl}
                alt={plannedMeal.recipe.name || "Recipe"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )}

          {/* Recipe Name */}
          <div className="text-gray-900 dark:text-white text-sm font-medium line-clamp-2">
            {plannedMeal.recipe?.name ?? "Unknown Recipe"}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-1">
            <button
              type="button"
              onClick={handleViewRecipe}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-medium"
              aria-label={`View details for ${plannedMeal.recipe?.name}`}
            >
              View
            </button>

            <AlertDialog
              open={showRemoveDialog}
              onOpenChange={setShowRemoveDialog}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs h-auto p-1"
                  aria-label={`Remove ${plannedMeal.recipe?.name} from ${formatMealType(mealType)}`}
                >
                  Remove
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove Meal</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove &quot;
                    {plannedMeal.recipe?.name}&quot; from{" "}
                    {formatMealType(mealType)} on{" "}
                    {new Date(date).toLocaleDateString()}? This action cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleConfirmRemove}
                    className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      {/* Drag State Indicators */}
      {dragState === "canDrop" && (
        <div className="absolute inset-0 flex items-center justify-center bg-green-500/10 rounded-md pointer-events-none">
          <div className="text-green-600 dark:text-green-400 text-lg">+</div>
        </div>
      )}

      {dragState === "cannotDrop" && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 rounded-md pointer-events-none">
          <div className="text-red-600 dark:text-red-400 text-lg">✗</div>
        </div>
      )}

      {/* Recipe Detail Modal */}
      {plannedMeal?.recipe && (
        <RecipeDetailModal
          isOpen={showRecipeDetail}
          onClose={() => setShowRecipeDetail(false)}
          recipe={plannedMeal.recipe}
          plannedMeal={plannedMeal}
          onRemove={onRemove}
        />
      )}
    </div>
  );
}
