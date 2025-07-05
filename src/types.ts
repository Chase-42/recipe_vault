// Category types and constants
export type Category = "Breakfast" | "Lunch" | "Dinner" | "Dessert" | "all";

export const MAIN_MEAL_CATEGORIES: Category[] = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Dessert",
];

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
  categories: string[];
  tags: string[];
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

// Legacy pagination format (for backward compatibility)
export interface PaginatedRecipes {
  recipes: Recipe[];
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
  recipeIngredient: string[];
}

// API response types for external services
export interface FlaskApiResponse {
  name?: string;
  imageUrl?: string;
  instructions?: string;
  ingredients?: string[];
}

export interface FallbackApiResponse {
  name?: string;
  image?: { url: string };
  recipeInstructions?: { text?: string }[];
  recipeIngredient: string[];
}

export interface ProcessedData {
  name: string;
  imageUrl: string;
  instructions: string;
  ingredients: string[];
  blurDataURL: string;
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

export type UpdateRecipeRequest = Partial<
  Omit<Recipe, "id" | "createdAt" | "userId">
>;

export type APIResponse<T> = {
  data?: T;
  error?: string;
};

// API response types
export interface FavoriteResponse {
  favorite: boolean;
}

export interface FetchRecipesParams {
  offset?: number;
  limit?: number;
  searchTerm?: string;
  category?: Category;
  sortOption?: "newest" | "oldest" | "favorite" | "relevance";
}

// Sort options
export type SortOption = "favorite" | "newest" | "oldest" | "relevance";

// Search parameters
export interface SearchParams {
  offset: number;
  limit: number;
  search?: string;
  category: Category;
  sort: SortOption;
}

// Recipe input types
export interface CreateRecipeInput {
  link: string;
  name: string;
  imageUrl: string;
  instructions: string;
  ingredients: string;
  favorite: boolean;
  categories: string[];
  tags: string[];
}

export interface UpdateRecipeInput extends Partial<CreateRecipeInput> {
  link?: string; // Make link optional for updates
}

// Shopping List Types
export interface ShoppingItem {
  id: number;
  userId: string;
  name: string;
  checked: boolean;
  recipeId?: number;
  createdAt: string;
}

export interface ShoppingItemRequest {
  name: string;
  recipeId: number;
}

export interface DeleteItemRequest {
  id: number;
}

export interface AddItemsRequest {
  items: ShoppingItemRequest[];
}

export interface UpdateItemRequest {
  checked: boolean;
}

// Mutation Types
export type MutationType = "create" | "update";

// API Request/Response Types
export interface RevalidateRequest {
  path: string;
}

export interface UploadResponse {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

// Component Props Types
export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void;
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export interface RecipeCardProps {
  recipe: Recipe;
  onFavoriteToggle: (recipeId: number, favorite: boolean) => void;
  searchMatches?: RecipeSearchMatch[];
}

export interface RecipeListProps {
  initialData?: PaginatedRecipes;
}

export interface RecipeFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: Category;
  setSelectedCategory: (category: Category) => void;
  sortOption: SortOption;
  onSortChange: (value: SortOption) => void;
}

export interface RecipePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export interface AddToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredients: string[];
  recipeId: number;
  recipeName: string;
}

export interface FullPageImageViewProps {
  recipe: Recipe;
}
