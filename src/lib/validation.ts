import { z } from "zod";

// Base schema for common string validation with length constraint
const createSanitizedString = (maxLength: number, fieldName: string) => 
  z.string()
    .trim()
    .min(1, "Field cannot be empty")
    .max(maxLength, `${fieldName} must be ${maxLength} characters or less`)
    .transform((str) => {
      // Remove zero-width spaces and normalize line endings
      return str
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
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
  ingredients: createSanitizedString(5000, "Ingredients")
    .transform(processMultilineText),
  instructions: createSanitizedString(10000, "Instructions")
    .transform(processMultilineText),
  favorite: z.boolean().optional().default(false),
});

export const updateRecipeSchema = createRecipeSchema.partial();

// Types
export type CreateRecipeInput = z.input<typeof createRecipeSchema>;
export type UpdateRecipeInput = z.input<typeof updateRecipeSchema>;

// Validation functions
export const validateCreateRecipe = (data: unknown) => {
  return createRecipeSchema.parse(data);
};

export const validateUpdateRecipe = (data: unknown) => {
  return updateRecipeSchema.parse(data);
};

// Helper function to safely parse numbers
export const validateId = (id: unknown): number => {
  const result = z.number().int().positive().safeParse(Number(id));
  if (!result.success) {
    throw new Error("Invalid ID");
  }
  return result.data;
}; 