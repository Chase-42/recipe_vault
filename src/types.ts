// Category types and constants
export type Category = "Breakfast" | "Lunch" | "Dinner" | "Dessert" | "All";

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
  imageWidth?: number | null;
  imageHeight?: number | null;
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

export interface PaginationMetadata {
  total: number;
  offset: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalPages: number;
  currentPage: number;
}

// Legacy pagination format (for backward compatibility)
export interface PaginatedRecipes {
  recipes: Recipe[];
  pagination: PaginationMetadata;
}

// API response types for external services
export interface FlaskApiResponse {
  name?: string;
  imageUrl?: string | null;
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
  imageWidth: number;
  imageHeight: number;
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

export interface FetchRecipesParams {
  offset?: number;
  limit?: number;
  searchTerm?: string;
  category?: Category;
  sortOption?: "newest" | "oldest" | "favorite" | "relevance";
}

// Sort options
export type SortOption = "favorite" | "newest" | "oldest" | "relevance";

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
  link?: string;
}

// Shopping List Types
export interface ShoppingItem {
  id: number;
  userId: string;
  name: string;
  checked: boolean;
  recipeId?: number;
  fromMealPlan: boolean;
  category?: string;
  createdAt: string;
}

export interface ShoppingItemRequest {
  name: string;
  recipeId: number;
}

export interface DeleteItemRequest {
  id: number;
}

// Mutation Types
export type MutationType = "create" | "update";

// Component Props Types
export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  fullHeight?: boolean;
}

export interface AddToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredients: string[];
  recipeId: number;
  recipeName: string;
}

// Meal Planning Types
export type MealType = "breakfast" | "lunch" | "dinner";

export interface MealPlan {
  id: number;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlannedMeal {
  id: number;
  userId: string;
  recipeId: number;
  mealPlanId?: number;
  date: string;
  mealType: MealType;
  createdAt: string;
  recipe?: Recipe;
}

export type WeeklyMealPlan = Record<
  string,
  {
    breakfast?: PlannedMeal;
    lunch?: PlannedMeal;
    dinner?: PlannedMeal;
  }
>;

// Ingredient parsing types for shopping list generation
export interface ParsedIngredient {
  name: string;
  quantity?: number;
  originalText: string;
}

// Enhanced ingredient parsing types for improved shopping list generation
export interface EnhancedParsedIngredient extends ParsedIngredient {
  id: string;
  sourceRecipes: Array<{
    recipeId: number;
    recipeName: string;
  }>;
  duplicateMatches: DuplicateMatch[];
  userModifications?: {
    quantity?: number;
    notes?: string;
  };
}

export interface DuplicateMatch {
  existingItemId: number;
  existingItemName: string;
  matchConfidence: "high" | "medium" | "low";
  suggestedAction: "skip" | "combine" | "add_separate";
}

export interface ProcessedIngredient extends ParsedIngredient {
  id: string;
  isSelected: boolean;
  editedQuantity?: number;
  duplicateMatches: DuplicateMatch[];
  sourceRecipes: Array<{
    recipeId: number;
    recipeName: string;
  }>;
}

export interface GenerateEnhancedShoppingListResponse {
  ingredients: EnhancedParsedIngredient[];
  existingItems: ShoppingItem[];
  duplicateAnalysis: DuplicateAnalysis;
}

export interface DuplicateAnalysis {
  totalDuplicates: number;
  highConfidenceMatches: number;
  suggestedActions: Array<{
    ingredientId: string;
    action: "skip" | "combine" | "add_separate";
    reason: string;
  }>;
}

export interface MealSlotProps {
  date: string;
  mealType: MealType;
  plannedMeal?: PlannedMeal;
  onDrop: (recipe: Recipe, date: string, mealType: MealType) => void;
  onRemove: (plannedMeal: PlannedMeal) => void;
  isDragOver?: boolean;
  canDrop?: boolean;
  isMobile?: boolean;
  gridRow?: number;
  gridCol?: number;
}

export interface GeneratedShoppingListProps {
  ingredients: ParsedIngredient[];
  onAddToShoppingList: (ingredients: ParsedIngredient[]) => Promise<void>;
  isLoading?: boolean;
  isAddingToList?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

// Enhanced shopping list component props
export interface EnhancedGeneratedShoppingListProps {
  ingredients: EnhancedParsedIngredient[];
  existingItems: ShoppingItem[];
  onAddToShoppingList: (ingredients: ProcessedIngredient[]) => Promise<void>;
  isLoading?: boolean;
  isAddingToList?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}
