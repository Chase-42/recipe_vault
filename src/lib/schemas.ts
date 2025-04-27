import { z } from "zod";
import type { Category } from "~/types/category";

const image = z.object({
  url: z.string(),
  height: z.number().optional(),
  width: z.number().optional(),
});

const recipe = z.object({
  id: z.number(),
  name: z.string(),
  link: z.string(),
  imageUrl: z.string(),
  blurDataUrl: z.string(),
  instructions: z.string(),
  ingredients: z.string(),
  favorite: z.boolean(),
  createdAt: z.string(),
  userId: z.string().optional(),
  categories: z.string().optional(),
  tags: z.string().optional(),
});

const recipeWithCategories = recipe.extend({
  categories: z.string().optional(),
  tags: z.string().optional(),
});

const paginationMetadata = z.object({
  total: z.number(),
  offset: z.number(),
  limit: z.number(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
  totalPages: z.number(),
  currentPage: z.number(),
});

const paginatedRecipes = z.object({
  recipes: z.array(recipe),
  pagination: paginationMetadata,
});

const recipeInstruction = z.union([
  z.object({
    "@type": z.literal("HowToStep"),
    text: z.string(),
    image: z.array(image).optional(),
  }),
  z.object({
    "@type": z.literal("HowToText"),
    text: z.string().optional(),
  }),
  z.object({
    "@type": z.literal("HowToSection"),
    text: z.string().optional(),
  }),
]);

const flaskApiResponse = z.object({
  name: z.string().optional(),
  imageUrl: z.string().optional(),
  instructions: z.string().optional(),
  ingredients: z.array(z.string()).optional(),
});

const fallbackApiResponse = z.object({
  name: z.string().optional(),
  image: z.object({ url: z.string() }).optional(),
  recipeInstructions: z.array(recipeInstruction).optional(),
  recipeIngredient: z.array(z.string()).optional(),
});

const processedData = z.object({
  name: z.string(),
  imageUrl: z.string(),
  instructions: z.string(),
  ingredients: z.array(z.string()),
  blurDataURL: z.string(),
});

const updatedRecipe = recipe.pick({
  name: true,
  instructions: true,
  ingredients: true,
  imageUrl: true,
  favorite: true,
});

const createRecipeRequest = z.object({
  link: z.string().min(1, "Valid link required"),
});

const apiResponse = <T extends z.ZodType>(schema: T) =>
  z.object({
    data: schema.optional(),
    error: z.string().optional(),
  });

const favoriteResponse = z.object({
  favorite: z.boolean(),
});

const sortOption = z.enum(["favorite", "newest", "oldest"]);

export const schemas = {
  recipe,
  recipeWithCategories,
  paginatedRecipes,
  flaskApiResponse,
  fallbackApiResponse,
  processedData,
  recipeInstruction,
  updatedRecipe,
  createRecipeRequest,
  apiResponse,
  favoriteResponse,
  sortOption,
} as const;

// Export all types derived from Zod schemas
export type Recipe = z.infer<typeof recipe>;
export type RecipeWithCategories = z.infer<typeof recipeWithCategories>;
export type PaginatedRecipes = z.infer<typeof paginatedRecipes>;
export type FlaskApiResponse = z.infer<typeof flaskApiResponse>;
export type FallbackApiResponse = z.infer<typeof fallbackApiResponse>;
export type ProcessedData = z.infer<typeof processedData>;
export type RecipeInstruction = z.infer<typeof recipeInstruction>;
export type UpdatedRecipe = z.infer<typeof updatedRecipe>;
export type CreateRecipeRequest = z.infer<typeof createRecipeRequest>;
export type APIResponse<T extends z.ZodType> = z.infer<
  ReturnType<typeof apiResponse<T>>
>;
export type SortOption = z.infer<typeof sortOption>;
