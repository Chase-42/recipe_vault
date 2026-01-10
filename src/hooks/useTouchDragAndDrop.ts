"use client";

import { useCallback, useState } from "react";
import type { Recipe } from "~/types";

interface TouchDragState {
  isDragging: boolean;
  draggedRecipe: Recipe | null;
  dragPosition: { x: number; y: number } | null;
  dragOffset: { x: number; y: number } | null;
}

interface TouchDragHandlers {
  onDragStart: (recipe: Recipe, position: { x: number; y: number }) => void;
  onDragMove: (position: { x: number; y: number }) => void;
  onDragEnd: (dropTarget?: { date: string; mealType: string }) => void;
}

// Custom hook for touch-friendly drag and drop functionality
export function useTouchDragAndDrop(handlers: TouchDragHandlers) {
  const [dragState, setDragState] = useState<TouchDragState>({
    isDragging: false,
    draggedRecipe: null,
    dragPosition: null,
    dragOffset: null,
  });

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, recipe: Recipe) => {
      e.preventDefault();

      const touch = e.touches[0];
      if (!touch) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const offset = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };

      const position = {
        x: touch.clientX,
        y: touch.clientY,
      };

      setDragState({
        isDragging: true,
        draggedRecipe: recipe,
        dragPosition: position,
        dragOffset: offset,
      });

      handlers.onDragStart(recipe, position);
    },
    [handlers]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!dragState.isDragging) return;

      e.preventDefault();

      const touch = e.touches[0];
      if (!touch) return;

      const position = {
        x: touch.clientX,
        y: touch.clientY,
      };

      setDragState((prev) => ({
        ...prev,
        dragPosition: position,
      }));

      handlers.onDragMove(position);
    },
    [dragState.isDragging, handlers]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!dragState.isDragging) return;

      e.preventDefault();

      const touch = e.changedTouches[0];
      if (!touch) return;

      // Find the element under the touch point
      const elementBelow = document.elementFromPoint(
        touch.clientX,
        touch.clientY
      );

      // Look for a meal slot drop target
      let dropTarget: { date: string; mealType: string } | undefined;

      if (elementBelow) {
        const mealSlot = elementBelow.closest("[data-meal-slot]");
        if (mealSlot) {
          const date = mealSlot.getAttribute("data-date");
          const mealType = mealSlot.getAttribute("data-meal-type");

          if (date && mealType) {
            dropTarget = { date, mealType };
          }
        }
      }

      setDragState({
        isDragging: false,
        draggedRecipe: null,
        dragPosition: null,
        dragOffset: null,
      });

      handlers.onDragEnd(dropTarget);
    },
    [dragState.isDragging, handlers]
  );

  const getDragElementStyle = useCallback(() => {
    if (
      !dragState.isDragging ||
      !dragState.dragPosition ||
      !dragState.dragOffset
    ) {
      return {};
    }

    return {
      position: "fixed" as const,
      left: dragState.dragPosition.x - dragState.dragOffset.x,
      top: dragState.dragPosition.y - dragState.dragOffset.y,
      zIndex: 1000,
      pointerEvents: "none" as const,
      transform: "rotate(5deg) scale(0.9)",
      opacity: 0.8,
    };
  }, [dragState]);

  return {
    dragState,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    getDragElementStyle,
  };
}
