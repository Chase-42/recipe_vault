import { z } from "zod";

const validDate = (message: string) =>
  z.string().refine((d) => !Number.isNaN(new Date(d).getTime()), { message });

const dateField = validDate("Invalid date format");
const weekStartField = validDate("Invalid weekStart date");

export const addMealToWeekSchema = z.object({
  recipeId: z.number().int().positive(),
  date: dateField,
  mealType: z.enum(["breakfast", "lunch", "dinner"]),
});

export const moveMealInWeekSchema = z.object({
  mealId: z.number().int().positive(),
  newDate: dateField,
  newMealType: z.enum(["breakfast", "lunch", "dinner"]),
});

export const deleteMealFromWeekSchema = z.object({
  date: dateField,
  mealType: z.enum(["breakfast", "lunch", "dinner"]),
});

export const generateShoppingListSchema = z.object({
  weekStart: weekStartField,
  addToList: z.boolean().default(false),
  clearExisting: z.boolean().default(false),
});

export const weekStartQuerySchema = z.object({
  weekStart: weekStartField,
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
