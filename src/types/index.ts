export interface Recipe {
  id: number;
  name: string;
  link: string;
  imageUrl: string;
  blurDataUrl: string;
  instructions: string;
  ingredients: string;
  favorite: boolean;
  createdAt: string;
  userId: string;
}

export interface PaginationMetadata {
  total: number;
  offset: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalPages: number;
  currentPage: number;
}

export interface PaginatedResponse {
  recipes: Recipe[];
  pagination: PaginationMetadata;
}

export interface APIResponse<T> {
  data?: T;
  error?: string;
}

export interface RecipeDetails {
  name: string;
  imageUrl: string;
  instructions: string;
  ingredients: string[];
}

export interface RecipeResponse {
  name?: string;
  image?: {
    url: string;
  };
  recipeInstructions?: { text?: string }[];
  recipeIngredient?: string[];
}

export interface CreateRecipeRequest {
  link: string;
} 