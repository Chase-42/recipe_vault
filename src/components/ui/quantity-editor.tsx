"use client";

import * as React from "react";
import { cn } from "~/lib/utils";
import { Input } from "./input";

// Common units for recipe ingredients
export const COMMON_UNITS = [
  // Volume units
  "cup",
  "tbsp",
  "tsp",
  "fl oz",
  "pint",
  "quart",
  "gallon",
  "liter",
  "ml",
  // Weight units
  "lb",
  "oz",
  "g",
  "kg",
  // Count/piece units
  "piece",
  "whole",
  "each",
  "clove",
  "slice",
  "can",
  "jar",
  "package",
  "bunch",
];

// Unit compatibility groups for combining ingredients
export const UNIT_COMPATIBILITY_GROUPS = {
  volume: [
    "cup",
    "tbsp",
    "tsp",
    "fl oz",
    "pint",
    "quart",
    "gallon",
    "liter",
    "ml",
  ],
  weight: ["lb", "oz", "g", "kg"],
  count: [
    "piece",
    "whole",
    "each",
    "clove",
    "slice",
    "can",
    "jar",
    "package",
    "bunch",
  ],
};

// Function to parse quantity values from strings
export const parseQuantityValue = (value: string): number => {
  if (!value.trim()) return 0;

  try {
    // Handle fractions like "1/2" or "2 1/2"
    if (value.includes("/")) {
      const parts = value.split(/\s+/);
      let total = 0;

      for (const part of parts) {
        if (part.includes("/")) {
          const [num, den] = part.split("/").map(Number);
          if (num !== undefined && den !== undefined && den !== 0) {
            total += num / den;
          }
        } else {
          const numPart = Number(part);
          if (!Number.isNaN(numPart)) {
            total += numPart;
          }
        }
      }
      return total;
    }

    // Handle ranges like "2-3"
    if (value.includes("-")) {
      const [min, max] = value.split("-").map(Number);
      if (
        min !== undefined &&
        max !== undefined &&
        !Number.isNaN(min) &&
        !Number.isNaN(max)
      ) {
        return (min + max) / 2; // Use average
      }
    }

    const result = Number(value);
    return Number.isNaN(result) ? 0 : result;
  } catch {
    return 0;
  }
};

export interface QuantityEditorProps {
  quantity?: number;
  onQuantityChange: (quantity: number) => void;
  isDisabled?: boolean;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

const QuantityEditor = React.forwardRef<HTMLDivElement, QuantityEditorProps>(
  (
    {
      quantity,
      onQuantityChange,
      isDisabled = false,
      className,
      placeholder = "Amount",
      autoFocus = false,
    },
    ref
  ) => {
    const [localQuantity, setLocalQuantity] = React.useState<string>(
      quantity?.toString() ?? ""
    );
    const [isEditing, setIsEditing] = React.useState(false);
    const [validationError, setValidationError] = React.useState<string>("");

    const quantityInputRef = React.useRef<HTMLInputElement>(null);

    // Update local state when props change
    React.useEffect(() => {
      if (!isEditing) {
        setLocalQuantity(quantity?.toString() ?? "");
      }
    }, [quantity, isEditing]);

    // Auto-focus when requested
    React.useEffect(() => {
      if (autoFocus && quantityInputRef.current) {
        quantityInputRef.current.focus();
      }
    }, [autoFocus]);

    const validateQuantity = (value: string): string => {
      if (!value.trim()) {
        return ""; // Empty is valid (will be treated as no quantity)
      }

      // Allow fractions like "1/2", "2 1/2"
      const fractionPattern = /^(\d+\s+)?\d+\/\d+$/;
      // Allow decimals
      const decimalPattern = /^\d*\.?\d+$/;
      // Allow ranges like "2-3"
      const rangePattern = /^\d+(\.\d+)?-\d+(\.\d+)?$/;

      if (
        !fractionPattern.test(value.trim()) &&
        !decimalPattern.test(value.trim()) &&
        !rangePattern.test(value.trim())
      ) {
        return "Please enter a valid number, fraction (e.g., 1/2), or range (e.g., 2-3)";
      }

      return "";
    };

    const handleQuantityChange = (value: string) => {
      setLocalQuantity(value);
      const error = validateQuantity(value);
      setValidationError(error);
    };

    const handleQuantityBlur = () => {
      setIsEditing(false);

      const quantityError = validateQuantity(localQuantity);
      if (quantityError) {
        setValidationError(quantityError);
        return;
      }

      setValidationError("");
      const parsedQuantity = parseQuantityValue(localQuantity);
      onQuantityChange(parsedQuantity);
    };

    const handleQuantityFocus = () => {
      setIsEditing(true);
      setValidationError("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.currentTarget.blur();
      } else if (e.key === "Escape") {
        // Reset to original values
        setLocalQuantity(quantity?.toString() ?? "");
        setValidationError("");
        setIsEditing(false);
        e.currentTarget.blur();
      }
    };

    const displayQuantity = isEditing
      ? localQuantity
      : quantity?.toString() ?? "";

    return (
      <div ref={ref} className={cn("flex items-center", className)}>
        <div className="flex-1 min-w-0">
          <Input
            ref={quantityInputRef}
            type="text"
            value={displayQuantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            onFocus={handleQuantityFocus}
            onBlur={handleQuantityBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isDisabled}
            className={cn(
              "text-center",
              validationError &&
                "border-destructive focus-visible:ring-destructive"
            )}
            aria-label="Quantity"
            aria-invalid={!!validationError}
            aria-describedby={validationError ? "quantity-error" : undefined}
          />
          {validationError && (
            <p
              id="quantity-error"
              className="text-xs text-destructive mt-1"
              role="alert"
            >
              {validationError}
            </p>
          )}
        </div>
      </div>
    );
  }
);

QuantityEditor.displayName = "QuantityEditor";

export { QuantityEditor };
