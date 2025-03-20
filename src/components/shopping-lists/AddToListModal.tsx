"use client";

import { useState, useCallback, memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { ScrollArea } from "~/components/ui/scroll-area";

interface AddToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredients: string[];
  recipeId: number;
  recipeName: string;
}

const IngredientItem = memo(function IngredientItem({
  ingredient,
  index,
  checked,
  onToggle,
}: {
  ingredient: string;
  index: number;
  checked: boolean;
  onToggle: (index: number) => void;
}) {
  return (
    <div className="flex items-center space-x-2 rounded-lg p-2 hover:bg-accent">
      <Checkbox
        id={`ingredient-${index}`}
        checked={checked}
        onCheckedChange={() => onToggle(index)}
      />
      <label
        htmlFor={`ingredient-${index}`}
        className="flex-1 cursor-pointer text-sm"
      >
        {ingredient}
      </label>
    </div>
  );
});

export function AddToListModal({
  isOpen,
  onClose,
  ingredients,
  recipeId,
  recipeName,
}: AddToListModalProps) {
  const [selectedIngredients, setSelectedIngredients] = useState<Set<number>>(
    new Set(),
  );

  const handleToggleIngredient = useCallback((index: number) => {
    setSelectedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIngredients(new Set(ingredients.map((_, index) => index)));
  }, [ingredients]);

  const handleClearAll = useCallback(() => {
    setSelectedIngredients(new Set());
  }, []);

  const handleAddToList = async () => {
    try {
      const selectedItems = Array.from(selectedIngredients).map((index) => ({
        name: ingredients[index],
        recipeId,
      }));

      if (selectedItems.length === 0) return;

      const response = await fetch("/api/shopping-lists/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: selectedItems }),
      });

      if (!response.ok) {
        throw new Error("Failed to add items to shopping list");
      }

      onClose();
    } catch (error) {
      console.error("Error adding items to list:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Ingredients from {recipeName}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            <div className="flex justify-end space-x-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearAll}>
                Clear All
              </Button>
            </div>
            <div className="space-y-2">
              {ingredients.map((ingredient, index) => (
                <IngredientItem
                  key={index}
                  ingredient={ingredient}
                  index={index}
                  checked={selectedIngredients.has(index)}
                  onToggle={handleToggleIngredient}
                />
              ))}
            </div>
          </div>
        </ScrollArea>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAddToList}>
            Add {selectedIngredients.size} Items
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
