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
  userId?: string;
  categories?: string;
  tags?: string;
  _matches?: Array<{
    key: string;
    value: string;
    indices: Array<[number, number]>;
  }>;
}

export interface RecipesData {
  pages: {
    recipes: Recipe[];
    nextCursor?: number;
  }[];
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

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

export interface RecipeDetails {
  name: string;
  imageUrl: string;
  instructions: string;
  ingredients: string[];
}

export interface RecipeData {
  name: string;
  image: { url: string };
  recipeInstructions: { text?: string }[];
  recipeIngredient: string[];
}

interface Image {
  url: string;
  height: number;
  width: number;
}

export type RecipeInstruction =
  | {
      text: string;
      image?: Image[];
    }
  | {
      text?: string;
    }
  | {
      "@type": "HowToSection";
      text?: string;
    };

export interface RecipeResponse {
  name?: string;
  image?: {
    url: string;
  };
  recipeInstructions?: { text?: string }[];
  recipeIngredient?: string[];
}

export interface UpdatedRecipe {
  favorite: boolean;
  name: string;
  instructions: string;
  ingredients: string;
  imageUrl: string;
}

export interface RecipeSearchMatch {
  key: string;
  value: string;
  indices: Array<[number, number]>;
}

export type RecipeWithMatches = Recipe & {
  _matches?: RecipeSearchMatch[];
};

export type CreateRecipeRequest = {
  link: string;
};

export type UpdateRecipeRequest = Partial<
  Omit<Recipe, "id" | "createdAt" | "userId">
>;

export type APIResponse<T> = {
  data?: T;
  error?: string;
};
