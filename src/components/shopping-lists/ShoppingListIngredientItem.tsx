"use client";

import React, { useCallback, useMemo } from "react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Checkbox } from "~/components/ui/checkbox";
import { QuantityEditor } from "~/components/ui/quantity-editor";
import {
  AlertTriangle,
  Info,
  CheckCircle2,
} from "lucide-react";
import type {
  EnhancedParsedIngredient,
  DuplicateMatch,
  DuplicateAction,
} from "~/types";

export interface ShoppingListIngredientItemProps {
  ingredient: EnhancedParsedIngredient;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  onQuantityChange: (id: string, quantity: number) => void;
  onDuplicateAction: (id: string, action: DuplicateAction) => void;
  isDisabled?: boolean;
}

const ShoppingListIngredientItem = React.forwardRef<
  HTMLDivElement,
  ShoppingListIngredientItemProps
>(
  (
    {
      ingredient,
      isSelected,
      onToggleSelection,
      onQuantityChange,
      onDuplicateAction,
      isDisabled = false,
    },
    ref
  ) => {
    // Format ingredient display
    const formatIngredientDisplay = useCallback(
      (
        name: string,
        quantity?: number,
        userModifications?: { quantity?: number }
      ): string => {
        const currentQuantity = userModifications?.quantity ?? quantity;

        if (currentQuantity) {
          return `${currentQuantity} ${name}`;
        }
        return name;
      },
      []
    );

    // Get primary duplicate match
    const getPrimaryDuplicate = useCallback(
      (duplicateMatches: DuplicateMatch[]): DuplicateMatch | null => {
        if (duplicateMatches.length === 0) return null;

        const sorted = [...duplicateMatches].sort((a, b) => {
          const confidenceOrder = { high: 3, medium: 2, low: 1 };
          return (
            confidenceOrder[b.matchConfidence] -
            confidenceOrder[a.matchConfidence]
          );
        });

        return sorted[0]!;
      },
      []
    );

    // Get duplicate indicator styling
    const getDuplicateIndicator = useCallback(
      (confidence: "high" | "medium" | "low") => {
        switch (confidence) {
          case "high":
            return {
              icon: AlertTriangle,
              color: "text-destructive",
              bgColor: "bg-destructive/10 border-destructive/20",
              label: "Likely duplicate",
              description:
                "Very likely duplicate - consider skipping or combining",
            };
          case "medium":
            return {
              icon: Info,
              color: "text-primary",
              bgColor: "bg-primary/10 border-primary/20",
              label: "Possible duplicate",
              description: "Might be duplicate - review before adding",
            };
          case "low":
            return {
              icon: CheckCircle2,
              color: "text-muted-foreground",
              bgColor: "bg-muted/50 border-muted",
              label: "Low match",
              description: "Unlikely duplicate - probably safe to add",
            };
        }
      },
      []
    );

    // Generate accessibility label
    const generateAriaLabel = useCallback(
      (isSelected: boolean, name: string, quantity?: number): string => {
        const selectionState = isSelected ? "Selected" : "Not selected";
        const ingredientDisplay = quantity ? `${quantity} ${name}` : name;

        return `${selectionState} ingredient: ${ingredientDisplay}`;
      },
      []
    );

    const primaryDuplicate = useMemo(
      () => getPrimaryDuplicate(ingredient.duplicateMatches),
      [ingredient.duplicateMatches, getPrimaryDuplicate]
    );

    const duplicateIndicator = useMemo(
      () =>
        primaryDuplicate
          ? getDuplicateIndicator(primaryDuplicate.matchConfidence)
          : null,
      [primaryDuplicate, getDuplicateIndicator]
    );

    const displayText = useMemo(
      () =>
        formatIngredientDisplay(
          ingredient.name,
          ingredient.quantity,
          ingredient.userModifications
        ),
      [
        ingredient.name,
        ingredient.quantity,
        ingredient.userModifications,
        formatIngredientDisplay,
      ]
    );

    const ariaLabel = useMemo(
      () =>
        generateAriaLabel(
          isSelected,
          ingredient.name,
          ingredient.userModifications?.quantity ?? ingredient.quantity
        ),
      [
        isSelected,
        ingredient.name,
        ingredient.quantity,
        ingredient.userModifications,
        generateAriaLabel,
      ]
    );

    // Event handlers
    const handleToggleSelection = useCallback(() => {
      if (!isDisabled) {
        onToggleSelection(ingredient.id);
      }
    }, [isDisabled, onToggleSelection, ingredient.id]);

    const handleQuantityChange = useCallback(
      (quantity: number) => {
        onQuantityChange(ingredient.id, quantity);
      },
      [onQuantityChange, ingredient.id]
    );

    const handleDuplicateAction = useCallback(
      (action: DuplicateAction) => {
        onDuplicateAction(ingredient.id, action);
      },
      [onDuplicateAction, ingredient.id]
    );

    return (
      <div
        ref={ref}
        className={`
          p-3 border rounded-md transition-colors
          ${isSelected ? "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800" : "bg-background border-border hover:bg-muted/50"}
          ${duplicateIndicator ? duplicateIndicator.bgColor : ""}
          ${isDisabled ? "opacity-50" : ""}
        `}
        role="listitem"
        aria-label={ariaLabel}
      >
        <div className="flex items-start gap-3">
          {/* Selection checkbox */}
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => handleToggleSelection()}
            disabled={isDisabled}
            aria-label={`${isSelected ? "Deselect" : "Select"} ${ingredient.name}`}
            className="mt-0.5"
          />

          <div className="flex-1 min-w-0 space-y-2">
            {/* Main ingredient display */}
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-foreground">{displayText}</span>

              {/* Duplicate indicator */}
              {duplicateIndicator && (
                <Badge
                  variant="outline"
                  className="text-xs"
                  title={duplicateIndicator.description}
                >
                  <duplicateIndicator.icon className="h-3 w-3 mr-1" />
                  {duplicateIndicator.label}
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

            {/* Quantity editor */}
            <div className="w-fit">
              <QuantityEditor
                quantity={
                  ingredient.userModifications?.quantity ??
                  ingredient.quantity ??
                  1
                }
                onQuantityChange={handleQuantityChange}
                isDisabled={isDisabled || !isSelected}
              />
            </div>

            {/* Duplicate resolution actions */}
            {primaryDuplicate && isSelected && (
              <div className="pt-2 border-t border-border space-y-2">
                <div className="text-xs text-muted-foreground">
                  Matches existing: &quot;{primaryDuplicate.existingItemName}
                  &quot;
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicateAction({
                        type: "skip",
                        existingItemId: primaryDuplicate.existingItemId,
                      });
                    }}
                    className="text-xs h-7 px-2"
                    disabled={isDisabled}
                  >
                    Skip
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicateAction({
                        type: "combine",
                        existingItemId: primaryDuplicate.existingItemId,
                      });
                    }}
                    className="text-xs h-7 px-2"
                    disabled={isDisabled}
                  >
                    Combine
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicateAction({
                        type: "add_separate",
                        existingItemId: primaryDuplicate.existingItemId,
                      });
                    }}
                    className="text-xs h-7 px-2"
                    disabled={isDisabled}
                  >
                    Add Separate
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ShoppingListIngredientItem.displayName = "ShoppingListIngredientItem";

export { ShoppingListIngredientItem };
