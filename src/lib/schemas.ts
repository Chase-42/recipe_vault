import { z } from "zod";
import { MAIN_MEAL_CATEGORIES } from "~/types";

const DEFAULT_LIMIT = 12;

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
  imageWidth: z.number().nullable().optional(),
  imageHeight: z.number().nullable().optional(),
  blurDataUrl: z.string(),
  instructions: z.string(),
  ingredients: z.string(),
  favorite: z.boolean(),
  createdAt: z.string(),
  userId: z.string().optional(),
  categories: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
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
  imageUrl: z.string().nullable().optional(),
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
  imageWidth: z.number(),
  imageHeight: z.number(),
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

// Updated to match standardized API response format
const apiResponse = <T extends z.ZodType>(schema: T) =>
  z.discriminatedUnion("success", [
    z.object({
      success: z.literal(true),
      data: schema,
    }),
    z.object({
      success: z.literal(false),
      error: z.string(),
      code: z.string().optional(),
    }),
  ]);

const paginatedApiResponse = <T extends z.ZodType>(schema: T) =>
  z.object({
    success: z.literal(true),
    data: z.array(schema),
    pagination: paginationMetadata,
  });

const favoriteResponse = z.object({
  success: z.literal(true),
  data: z.object({
    favorite: z.boolean(),
  }),
});

const searchParamsSchema = z.object({
  offset: z.number().min(0).default(0),
  limit: z.number().min(1).max(100).default(DEFAULT_LIMIT),
  search: z.string().optional(),
  category: z.enum(["All", ...MAIN_MEAL_CATEGORIES]).default("All"),
  sort: z.enum(["newest", "oldest", "favorite", "relevance"]).default("newest"),
});

const sortOption = z.enum(["favorite", "newest", "oldest"]);

export const schemas = {
  recipe,
  paginatedRecipes,
  flaskApiResponse,
  fallbackApiResponse,
  processedData,
  recipeInstruction,
  updatedRecipe,
  createRecipeRequest,
  apiResponse,
  paginatedApiResponse,
  favoriteResponse,
  sortOption,
  searchParamsSchema,
} as const;

// Note: This file now only exports Zod schemas for validation
// All TypeScript types should be imported from ~/types
