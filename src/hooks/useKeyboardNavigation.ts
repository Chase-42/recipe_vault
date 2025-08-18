"use client";

import { useCallback, useEffect, useRef } from "react";

interface KeyboardNavigationOptions {
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onEnter?: () => void;
  onEscape?: () => void;
  onDelete?: () => void;
  onSpace?: () => void;
  enabled?: boolean;
}

/**
 * Custom hook for keyboard navigation in meal planner
 * Provides arrow key navigation, enter/space for selection, delete for removal
 */
export function useKeyboardNavigation(options: KeyboardNavigationOptions) {
  const {
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onEnter,
    onEscape,
    onDelete,
    onSpace,
    enabled = true,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Prevent default behavior for navigation keys
      const navigationKeys = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Enter",
        " ",
        "Escape",
        "Delete",
        "Backspace",
      ];

      if (navigationKeys.includes(event.key)) {
        event.preventDefault();
      }

      switch (event.key) {
        case "ArrowUp":
          onArrowUp?.();
          break;
        case "ArrowDown":
          onArrowDown?.();
          break;
        case "ArrowLeft":
          onArrowLeft?.();
          break;
        case "ArrowRight":
          onArrowRight?.();
          break;
        case "Enter":
          onEnter?.();
          break;
        case " ": // Space key
          onSpace?.();
          break;
        case "Escape":
          onEscape?.();
          break;
        case "Delete":
        case "Backspace":
          onDelete?.();
          break;
      }
    },
    [
      enabled,
      onArrowUp,
      onArrowDown,
      onArrowLeft,
      onArrowRight,
      onEnter,
      onSpace,
      onEscape,
      onDelete,
    ]
  );

  useEffect(() => {
    if (enabled) {
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [enabled, handleKeyDown]);

  return { handleKeyDown };
}

/**
 * Hook for managing focus within a grid-like structure (like meal planner calendar)
 */
export function useGridNavigation(
  rows: number,
  cols: number,
  onCellSelect?: (row: number, col: number) => void,
  onCellActivate?: (row: number, col: number) => void
) {
  const currentPosition = useRef({ row: 0, col: 0 });
  const gridRef = useRef<HTMLDivElement>(null);

  const updateFocus = useCallback(
    (row: number, col: number) => {
      if (!gridRef.current) return;

      const cell = gridRef.current.querySelector(
        `[data-grid-row="${row}"][data-grid-col="${col}"]`
      );

      if (cell && "focus" in cell) {
        (cell as HTMLElement).focus();
        currentPosition.current = { row, col };
        onCellSelect?.(row, col);
      }
    },
    [onCellSelect]
  );

  const moveUp = useCallback(() => {
    const newRow = Math.max(0, currentPosition.current.row - 1);
    updateFocus(newRow, currentPosition.current.col);
  }, [updateFocus]);

  const moveDown = useCallback(() => {
    const newRow = Math.min(rows - 1, currentPosition.current.row + 1);
    updateFocus(newRow, currentPosition.current.col);
  }, [updateFocus, rows]);

  const moveLeft = useCallback(() => {
    const newCol = Math.max(0, currentPosition.current.col - 1);
    updateFocus(currentPosition.current.row, newCol);
  }, [updateFocus]);

  const moveRight = useCallback(() => {
    const newCol = Math.min(cols - 1, currentPosition.current.col + 1);
    updateFocus(currentPosition.current.row, newCol);
  }, [updateFocus, cols]);

  const activateCell = useCallback(() => {
    onCellActivate?.(currentPosition.current.row, currentPosition.current.col);
  }, [onCellActivate]);

  useKeyboardNavigation({
    onArrowUp: moveUp,
    onArrowDown: moveDown,
    onArrowLeft: moveLeft,
    onArrowRight: moveRight,
    onEnter: activateCell,
    onSpace: activateCell,
  });

  return {
    gridRef,
    currentPosition: currentPosition.current,
    updateFocus,
  };
}

/**
 * Hook for meal planner specific keyboard interactions
 */
export function useMealPlannerKeyboard(
  onDeleteMeal?: () => void,
  onAddMeal?: () => void,
  onViewMeal?: () => void
) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      // Only handle keyboard events on meal slots
      if (!target.hasAttribute("data-meal-slot")) return;

      switch (event.key) {
        case "Delete":
        case "Backspace":
          event.preventDefault();
          onDeleteMeal?.();
          break;
        case "Enter":
          event.preventDefault();
          // If slot is empty, try to add meal, otherwise view meal
          const isEmpty = target.getAttribute("aria-label")?.includes("Empty");
          if (isEmpty) {
            onAddMeal?.();
          } else {
            onViewMeal?.();
          }
          break;
        case " ":
          event.preventDefault();
          onViewMeal?.();
          break;
      }
    },
    [onDeleteMeal, onAddMeal, onViewMeal]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return { handleKeyDown };
}
