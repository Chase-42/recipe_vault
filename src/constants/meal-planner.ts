import type { MealType } from "~/types";

// HSL color system for meal types
export const mealTypeColors: Record<MealType, string> = {
  breakfast: "hsl(25, 70%, 50%)", // Orange
  lunch: "hsl(210, 70%, 50%)", // Blue
  dinner: "hsl(270, 70%, 50%)", // Purple
};
