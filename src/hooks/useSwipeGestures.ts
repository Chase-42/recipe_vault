"use client";

import { useCallback, useRef } from "react";

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeOptions {
  threshold?: number; // Minimum distance for a swipe (default: 50px)
  preventDefaultTouchmoveEvent?: boolean; // Prevent default touchmove behavior
}

interface TouchPosition {
  x: number;
  y: number;
}

// Custom hook for handling swipe gestures on touch devices
export function useSwipeGestures(
  handlers: SwipeHandlers,
  options: SwipeOptions = {}
) {
  const {
    threshold = 50,
    preventDefaultTouchmoveEvent = false,
  } = options;

  const touchStartPos = useRef<TouchPosition | null>(null);
  const touchEndPos = useRef<TouchPosition | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      touchStartPos.current = {
        x: touch.clientX,
        y: touch.clientY,
      };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (preventDefaultTouchmoveEvent) {
      e.preventDefault();
    }
  }, [preventDefaultTouchmoveEvent]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    if (!touch || !touchStartPos.current) {
      return;
    }

    touchEndPos.current = {
      x: touch.clientX,
      y: touch.clientY,
    };

    const deltaX = touchEndPos.current.x - touchStartPos.current.x;
    const deltaY = touchEndPos.current.y - touchStartPos.current.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine if this is a horizontal or vertical swipe
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (absDeltaX > threshold) {
        if (deltaX > 0) {
          handlers.onSwipeRight?.();
        } else {
          handlers.onSwipeLeft?.();
        }
      }
    } else {
      // Vertical swipe
      if (absDeltaY > threshold) {
        if (deltaY > 0) {
          handlers.onSwipeDown?.();
        } else {
          handlers.onSwipeUp?.();
        }
      }
    }

    // Reset positions
    touchStartPos.current = null;
    touchEndPos.current = null;
  }, [handlers, threshold]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}