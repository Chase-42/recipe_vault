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

type DragState = "idle" | "canDrop" | "cannotDrop";

const mealTypeColors: Record<MealType, string> = {
  breakfast: "hsl(25, 70%, 50%)",
  lunch: "hsl(210, 70%, 50%)",
  dinner: "hsl(270, 70%, 50%)",
};

interface ExtendedMealSlotProps extends MealSlotProps {
  pendingRecipe?: Recipe | null;
  onMobilePlacement?: (date: string, mealType: MealType) => void;
}

export function MealSlot({
  date,
  mealType,
  plannedMeal,
  onDrop,
  onRemove,
  canDrop = true,
  isMobile = false,
  pendingRecipe,
  onMobilePlacement,
}: ExtendedMealSlotProps) {
  const [dragState, setDragState] = useState<DragState>("idle");
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showRecipeDetail, setShowRecipeDetail] = useState(false);

  const isEmpty = !plannedMeal;
  const borderColor = mealTypeColors[mealType];
  const hasPendingRecipe = isMobile && pendingRecipe && isEmpty;

  const handleSlotClick = () => {
    if (hasPendingRecipe && onMobilePlacement) {
      onMobilePlacement(date, mealType);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState(canDrop ? "canDrop" : "cannotDrop");
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState(canDrop ? "canDrop" : "cannotDrop");
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const { clientX: x, clientY: y } = e;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragState("idle");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState("idle");

    if (!canDrop) return;

    try {
      const recipeData = e.dataTransfer.getData("application/json");
      if (recipeData) {
        const recipe = JSON.parse(recipeData) as Recipe;
        onDrop(recipe, date, mealType);
      }
    } catch (error) {
      logger.error(
        "Error parsing dropped recipe data",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  };

  const handleConfirmRemove = () => {
    if (plannedMeal) {
      onRemove(plannedMeal);
    }
    setShowRemoveDialog(false);
  };

  const formatMealType = (type: MealType): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div
      className={`bg-transparent p-2 transition-all duration-200 ${
        isMobile ? "min-h-[100px]" : "min-h-[80px]"
      } ${hasPendingRecipe ? "cursor-pointer" : ""}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleSlotClick}
      role="gridcell"
      tabIndex={0}
      data-meal-slot="true"
      data-date={date}
      data-meal-type={mealType}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && hasPendingRecipe) {
          e.preventDefault();
          handleSlotClick();
        } else if ((e.key === "Enter" || e.key === " ") && !isEmpty) {
          e.preventDefault();
          setShowRecipeDetail(true);
        } else if ((e.key === "Delete" || e.key === "Backspace") && !isEmpty) {
          e.preventDefault();
          setShowRemoveDialog(true);
        }
      }}
    >
      <div
        className={`h-full p-2 rounded-md border-2 transition-colors ${isEmpty ? "border-dashed" : "border-solid"} ${
          hasPendingRecipe ? "bg-primary/10 border-primary" : ""
        }`}
        style={{ borderColor: hasPendingRecipe ? undefined : borderColor }}
      >
        <div
          className={`font-medium capitalize mb-2 ${isMobile ? "text-sm" : "text-xs"}`}
          style={{ color: hasPendingRecipe ? "hsl(var(--primary))" : borderColor }}
        >
          {formatMealType(mealType)}
        </div>

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <div className={`text-sm ${hasPendingRecipe ? "text-primary font-medium" : "text-gray-400 dark:text-gray-500"}`}>
              {hasPendingRecipe ? "Tap to place" : dragState === "canDrop" ? "Drop here" : "Empty"}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {plannedMeal.recipe?.imageUrl && (
              <div className={`relative w-full rounded overflow-hidden ${isMobile ? "h-20" : "h-16"}`}>
                <Image
                  src={plannedMeal.recipe.imageUrl}
                  alt={plannedMeal.recipe.name || "Recipe"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            )}

            <div className="text-gray-900 dark:text-white text-sm font-medium line-clamp-2">
              {plannedMeal.recipe?.name ?? "Unknown Recipe"}
            </div>

            <div className="flex justify-between items-center pt-1">
              <button
                type="button"
                onClick={() => setShowRecipeDetail(true)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-medium"
              >
                View
              </button>

              <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs h-auto p-1"
                  >
                    Remove
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Meal</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove &quot;{plannedMeal.recipe?.name}&quot; from{" "}
                      {formatMealType(mealType)} on {new Date(date).toLocaleDateString()}?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleConfirmRemove}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </div>

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
