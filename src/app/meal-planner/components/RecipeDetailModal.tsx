"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { X, Heart } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import type { Recipe, PlannedMeal } from "~/types";

interface RecipeDetailModalProps {
  recipe: Recipe;
  isOpen: boolean;
  onClose: () => void;
  plannedMeal?: PlannedMeal;
  onRemove?: (plannedMeal: PlannedMeal) => void;
}

export function RecipeDetailModal({
  recipe,
  isOpen,
  onClose,
  plannedMeal,
  onRemove,
}: RecipeDetailModalProps) {
  const [isFavorite, setIsFavorite] = useState(recipe.favorite);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus the close button when modal opens
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
    } else {
      // Restore focus to the previously focused element when modal closes
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen]);

  const handleToggleFavorite = async () => {
    try {
      const response = await fetch(`/api/recipes/${recipe.id}/favorite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ favorite: !isFavorite }),
      });

      if (response.ok) {
        setIsFavorite(!isFavorite);
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        aria-describedby="recipe-detail-description"
      >
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-xl font-bold pr-4">
              {recipe.name}
            </DialogTitle>
            <Button
              ref={closeButtonRef}
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 focus:ring-2 focus:ring-blue-500"
              aria-label="Close recipe details"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </DialogHeader>

        <div id="recipe-detail-description" className="sr-only">
          Recipe details for {recipe.name}. Use Tab to navigate through the
          content, Escape to close.
        </div>

        <div className="space-y-6">
          {/* Recipe Image */}
          {recipe.imageUrl && (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg">
              <Image
                src={recipe.imageUrl}
                alt={`Photo of ${recipe.name}`}
                fill
                className="object-cover"
                placeholder="blur"
                blurDataURL={recipe.blurDataUrl}
              />
            </div>
          )}

          {/* Recipe Metadata */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {recipe.categories.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Categories:</span>
                <div className="flex gap-1">
                  {recipe.categories.map((category) => (
                    <span
                      key={category}
                      className="px-2 py-1 bg-gray-100 rounded text-xs"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {recipe.tags && recipe.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Tags:</span>
                <div className="flex gap-1">
                  {recipe.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recipe Link */}
          {recipe.link && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Source:</span>
              <a
                href={recipe.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline text-sm"
              >
                View Original Recipe
              </a>
            </div>
          )}

          {/* Ingredients */}
          <section aria-labelledby="ingredients-heading">
            <h3 id="ingredients-heading" className="text-lg font-semibold mb-3">
              Ingredients
            </h3>
            <div
              className="bg-gray-50 rounded-lg p-4"
              role="region"
              aria-labelledby="ingredients-heading"
            >
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {recipe.ingredients}
              </pre>
            </div>
          </section>

          {/* Instructions */}
          <section aria-labelledby="instructions-heading">
            <h3
              id="instructions-heading"
              className="text-lg font-semibold mb-3"
            >
              Instructions
            </h3>
            <div
              className="bg-gray-50 rounded-lg p-4"
              role="region"
              aria-labelledby="instructions-heading"
            >
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {recipe.instructions}
              </pre>
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div
              className="flex items-center gap-2"
              role="group"
              aria-label="Recipe actions"
            >
              <Button
                variant="outline"
                onClick={handleToggleFavorite}
                className={`flex items-center gap-2 focus:ring-2 focus:ring-blue-500 ${
                  isFavorite ? "text-red-600 border-red-600" : ""
                }`}
                aria-pressed={isFavorite}
                aria-label={
                  isFavorite ? "Remove from favorites" : "Add to favorites"
                }
              >
                <Heart
                  className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`}
                  aria-hidden="true"
                />
                {isFavorite ? "Favorited" : "Add to Favorites"}
              </Button>

              {plannedMeal && onRemove && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    onRemove(plannedMeal);
                    onClose();
                  }}
                  className="flex items-center gap-2 focus:ring-2 focus:ring-red-500"
                  aria-label={`Remove ${recipe.name} from meal plan`}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  Remove from Meal Plan
                </Button>
              )}
            </div>

            <div className="text-xs text-gray-500" role="status">
              Added {new Date(recipe.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
