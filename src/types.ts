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
  fromMealPlan: boolean;
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
  fullHeight?: boolean;
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

// Meal Planning Types
export type MealType = "breakfast" | "lunch" | "dinner";

// Re-export for compatibility
export type { MealType as MealTypeExport };

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
  mealPlanId?: number; // null for current week planning
  date: string; // ISO date string (YYYY-MM-DD)
  mealType: MealType;
  createdAt: string;
  recipe?: Recipe; // Populated via join
}

export type WeeklyMealPlan = Record<
  string,
  {
    breakfast?: PlannedMeal;
    lunch?: PlannedMeal;
    dinner?: PlannedMeal;
  }
>;

export interface MealPlannerState {
  currentWeek: WeeklyMealPlan;
  selectedWeekStart: Date;
  availableRecipes: Recipe[];
  savedPlans: MealPlan[];
  generatedShoppingList: ShoppingItem[];
  draggedRecipe: Recipe | null;
}

// Meal Planning API Request/Response Types
export interface CreateMealPlanRequest {
  name: string;
  description?: string;
}

export type UpdateMealPlanRequest = Partial<CreateMealPlanRequest>;

export interface AddMealToWeekRequest {
  recipeId: number;
  date: string; // YYYY-MM-DD format
  mealType: MealType;
}

export interface MoveMealRequest {
  newDate: string; // YYYY-MM-DD format
  newMealType: MealType;
}

export interface SaveCurrentWeekAsPlanRequest {
  name: string;
  description?: string;
}

// Enhanced shopping list generation API types
export interface GenerateEnhancedShoppingListRequest {
  weekStart: string;
  includeExistingItems: boolean;
  consolidationPreference: "aggressive" | "conservative" | "manual";
}

export interface AddProcessedIngredientsRequest {
  ingredients: ProcessedIngredient[];
  duplicateActions: Array<{
    ingredientId: string;
    action: DuplicateAction;
  }>;
}

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
  id: string; // Unique identifier for UI
  isSelected: boolean;
  editedQuantity?: number;
  duplicateMatches: DuplicateMatch[];
  sourceRecipes: Array<{
    recipeId: number;
    recipeName: string;
  }>; // Recipe source information
}

export interface DuplicateAction {
  type: "skip" | "combine" | "add_separate";
  existingItemId?: number;
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

// Drag and drop state types
export interface DragState {
  draggedRecipe: Recipe | null;
  dragOverSlot: { date: string; mealType: MealType } | null;
  isDragging: boolean;
}

// Meal Planning Component Props
export interface WeeklyCalendarProps {
  weekStart: Date;
  meals: WeeklyMealPlan;
  onMealDrop: (recipe: Recipe, date: string, mealType: MealType) => void;
  onMealRemove: (plannedMeal: PlannedMeal) => void;
  onMealMove?: (
    meal: PlannedMeal,
    newDate: string,
    newMealType: MealType
  ) => void;
  onWeekChange?: (newWeekStart: Date) => void;
  dragState?: DragState;
  isDragOverSlot?: (date: string, mealType: MealType) => boolean;
  canDropOnSlot?: (date: string, mealType: MealType) => boolean;
  isMobile?: boolean;
  swipeHandlers?: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
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

export interface DraggableRecipeProps {
  recipe: Recipe;
  onDragStart: (recipe: Recipe) => void;
  isDragging?: boolean;
}

export interface RecipePanelProps {
  recipes: Recipe[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory: Category;
  onCategoryChange: (category: Category) => void;
  onRecipeDragStart: (recipe: Recipe) => void;
  isMobile?: boolean;
}

export interface MealPlanActionsProps {
  onSavePlan: (name: string, description?: string) => void;
  onLoadPlan: (mealPlanId: number) => void;
  savedPlans: MealPlan[];
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

export interface ShoppingListIngredientItemProps {
  ingredient: ProcessedIngredient;
  onToggleSelection: (id: string) => void;
  onQuantityChange: (id: string, quantity: number) => void;
  onDuplicateAction: (id: string, action: DuplicateAction) => void;
  isDisabled: boolean;
}

export interface ExistingItemsPanelProps {
  items: ShoppingItem[];
  highlightedItems: number[]; // Items that match new ingredients
  onItemToggle?: (itemId: number, checked: boolean) => void;
  isReadOnly?: boolean;
}

export interface QuantityEditorProps {
  quantity?: number;
  onQuantityChange: (quantity: number) => void;
  isDisabled?: boolean;
}
