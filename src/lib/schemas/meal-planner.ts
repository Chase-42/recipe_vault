import { z } from "zod";

export const addMealToWeekSchema = z.object({
  recipeId: z.number().int().positive(),
  date: z.string().refine((date) => !Number.isNaN(new Date(date).getTime()), {
    message: "Invalid date format",
  }),
  mealType: z.enum(["breakfast", "lunch", "dinner"]),
});

export const moveMealInWeekSchema = z.object({
  mealId: z.number().int().positive(),
  newDate: z.string().refine((date) => !Number.isNaN(new Date(date).getTime()), {
    message: "Invalid date format",
  }),
  newMealType: z.enum(["breakfast", "lunch", "dinner"]),
});

export const deleteMealFromWeekSchema = z.object({
  date: z.string().refine((date) => !Number.isNaN(new Date(date).getTime()), {
    message: "Invalid date format",
  }),
  mealType: z.enum(["breakfast", "lunch", "dinner"]),
});

export const generateShoppingListSchema = z.object({
  weekStart: z.string().refine((date) => !Number.isNaN(new Date(date).getTime()), {
    message: "Invalid weekStart date",
  }),
  addToList: z.boolean().default(false),
  clearExisting: z.boolean().default(false),
});

export const weekStartQuerySchema = z.object({
  weekStart: z.string().refine((date) => !Number.isNaN(new Date(date).getTime()), {
    message: "Invalid weekStart date",
  }),
  checkShoppingListStatus: z.string().optional(),
});

export const saveMealPlanSchema = z.object({
  name: z.string().min(1, "name is required and must be a string"),
  description: z.string().optional(),
  weekStart: z.string().optional(),
});

export const loadMealPlanSchema = z.object({
  mealPlanId: z.number().int().positive(),
});
