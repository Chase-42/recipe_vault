import { z } from "zod";
import type { CreateRecipeInput, UpdateRecipeInput } from "~/types";
import { ValidationError } from "./errors";

// Base schema for common string validation with length constraint
const createSanitizedString = (maxLength: number, fieldName: string) =>
  z
    .string()
    .trim()
    .min(1, "Field cannot be empty")
    .max(maxLength, `${fieldName} must be ${maxLength} characters or less`)
    .transform((str) => {
      // Remove zero-width spaces and normalize line endings
      return str
        .replace(/\u200B/g, "")
        .replace(/\u200C/g, "")
        .replace(/\u200D/g, "")
        .replace(/\uFEFF/g, "")
        .replace(/\r\n/g, "\n");
    });

// URL validation schema
const urlSchema = z
  .string()
  .trim()
  .url("Must be a valid URL")
  .transform((url) => url.replace(/\s+/g, ""));

// Multi-line text processing
const processMultilineText = (str: string): string =>
  str
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");

// Recipe validation schemas
export const createRecipeSchema = z.object({
  name: createSanitizedString(200, "Name"),
  link: urlSchema,
  imageUrl: urlSchema,
  ingredients: createSanitizedString(5000, "Ingredients").transform(
    processMultilineText
  ),
  instructions: createSanitizedString(10000, "Instructions").transform(
    processMultilineText
  ),
  favorite: z.boolean().optional().default(false),
  categories: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
});

// For updates, we want to make all fields optional except link which must be a string (can be empty)
export const updateRecipeSchema = createRecipeSchema.partial().extend({
  link: z.string(),
});

// Validation functions
export const validateCreateRecipe = (data: unknown): CreateRecipeInput => {
  return createRecipeSchema.parse(data);
};

export const validateUpdateRecipe = (data: unknown): UpdateRecipeInput => {
  return updateRecipeSchema.parse(data);
};

// Helper function to safely parse numbers
export const validateId = (id: unknown): number => {
  const result = z.number().int().positive().safeParse(Number(id));
  if (!result.success) {
    throw new ValidationError("Invalid ID");
  }
  return result.data;
};
