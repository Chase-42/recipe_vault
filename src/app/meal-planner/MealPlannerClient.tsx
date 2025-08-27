"use client";

import { useState, useRef, useCallback, useMemo, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Save,
  FolderOpen,
  ShoppingCart,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { handleError, handleAsyncError } from "~/lib/errorHandler";
import { logger } from "~/lib/logger";

import { withRetry } from "~/utils/retry";
import { useLoadingStates } from "~/hooks/useLoadingStates";

import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { AnimatedBackButton } from "~/components/ui/page-transition";
import { ArrowLeft } from "lucide-react";
import { GeneratedShoppingList } from "./components/GeneratedShoppingList";

import type {
  Recipe,
  MealType,
  WeeklyMealPlan,
  PlannedMeal,
  Category,
  MealPlan,
  GenerateEnhancedShoppingListResponse,
  ProcessedIngredient,
  ParsedIngredient,
} from "~/types";

// Memoized recipe card component for better performance
const MemoizedRecipeCard = memo(
  ({
    recipe,
    onDragStart,
    onDragEnd,
  }: {
    recipe: Recipe;
    onDragStart: (recipe: Recipe) => void;
    onDragEnd: () => void;
  }) => (
    <div
      key={recipe.id}
      draggable
      onDragStart={() => onDragStart(recipe)}
      onDragEnd={onDragEnd}
      className="p-3 bg-card rounded-lg border cursor-grab active:cursor-grabbing hover:bg-accent transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12 rounded-md overflow-hidden">
          <Image
            src={recipe.imageUrl}
            alt={recipe.name}
            fill
            className="object-cover"
            sizes="48px"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{recipe.name}</h3>
          <div className="flex flex-wrap gap-1 mt-1">
            {recipe.categories.slice(0, 2).map((category) => (
              <span
                key={category}
                className="text-xs px-2 py-0.5 rounded-full text-white"
                style={{
                  backgroundColor:
                    mealTypeColors[category.toLowerCase() as MealType] ||
                    "hsl(var(--muted))",
                }}
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
);

MemoizedRecipeCard.displayName = "MemoizedRecipeCard";

// Memoized meal slot component for better performance
const MemoizedMealSlot = memo(
  ({
    date,
    mealType,
    plannedMeal,
    isDragOver,
    onDragOver,
    onDragLeave,
    onDrop,
    onMealRemove,
    setDraggedMeal,
  }: {
    date: string;
    mealType: MealType;
    plannedMeal?: PlannedMeal;
    isDragOver: boolean;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
    onMealRemove: (meal: PlannedMeal) => void;
    setDraggedMeal?: (meal: PlannedMeal | null) => void;
  }) => (
    <div
      className={`p-3 border-r last:border-r-0 min-h-[100px] transition-colors ${
        isDragOver ? "bg-green-50 border-green-300" : "hover:bg-muted/50"
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {plannedMeal ? (
        <div
          className="bg-card rounded-md border-2 p-3 h-full hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center relative group"
          style={{ borderColor: mealTypeColors[mealType] }}
        >
          {/* Remove button - only visible on hover */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMealRemove(plannedMeal);
            }}
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-xs transition-all z-10 opacity-0 group-hover:opacity-100"
            aria-label={`Remove ${plannedMeal.recipe?.name}`}
            title="Remove from meal plan"
          >
            ×
          </button>

          <div className="relative w-16 h-16 rounded-md overflow-hidden mb-2 flex-shrink-0">
            <Image
              src={plannedMeal.recipe?.imageUrl ?? "/placeholder-recipe.jpg"}
              alt={plannedMeal.recipe?.name ?? "Recipe"}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <h4 className="font-medium text-xs leading-tight line-clamp-2">
            {plannedMeal.recipe?.name}
          </h4>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-md h-full flex items-center justify-center ${
            isDragOver
              ? "border-green-400 text-green-600 bg-green-50"
              : "border-muted-foreground/25"
          }`}
          style={{
            borderColor: isDragOver ? undefined : mealTypeColors[mealType],
          }}
        >
          <div
            className={`text-2xl ${isDragOver ? "text-green-600" : "text-muted-foreground"}`}
          >
            {isDragOver ? "+" : "+"}
          </div>
        </div>
      )}
    </div>
  )
);

MemoizedMealSlot.displayName = "MemoizedMealSlot";

// Helper function to get week start (Monday)
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

// HSL color system for meal types
const mealTypeColors = {
  breakfast: "hsl(25, 70%, 50%)", // Orange
  lunch: "hsl(210, 70%, 50%)", // Blue
  dinner: "hsl(270, 70%, 50%)", // Purple
} as const;

// Helper function to get week dates
function getWeekDates(weekStart: Date): string[] {
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const dateString = date.toISOString().split("T")[0];
    if (dateString) {
      dates.push(dateString);
    }
  }
  return dates;
}

// Helper function to format date for display
function formatDateDisplay(dateString: string): {
  dayName: string;
  dayNumber: number;
  isToday: boolean;
} {
  const date = new Date(dateString);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
  const dayNumber = date.getDate();

  return { dayName, dayNumber, isToday };
}

export function MealPlannerClient() {
  const [weekStart, setWeekStart] = useState<Date>(getWeekStart(new Date()));
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [draggedRecipe, setDraggedRecipe] = useState<Recipe | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{
    date: string;
    mealType: MealType;
  } | null>(null);

  // Dialog states
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showEnhancedShoppingList, setShowEnhancedShoppingList] =
    useState(false);

  // Enhanced shopping list state
  const [enhancedShoppingListData, setEnhancedShoppingListData] =
    useState<GenerateEnhancedShoppingListResponse | null>(null);
  const [isAddingToShoppingList, setIsAddingToShoppingList] = useState(false);
  const [planName, setPlanName] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  // Removed auto-generation of shopping lists - users must manually generate them

  // Fetch current week meals with error handling
  const {
    data: currentWeekMeals,
    isLoading: isLoadingMeals,
    error: mealsError,
  } = useQuery<WeeklyMealPlan>({
    queryKey: ["currentWeekMeals", weekStart.toISOString().split("T")[0]],
    queryFn: async () => {
      const response = await fetch(
        `/api/meal-planner/current-week?weekStart=${weekStart.toISOString().split("T")[0]}`
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to fetch meals");
      }
      return (await response.json()) as WeeklyMealPlan;
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fetch available recipes with error handling
  const {
    data: recipesData,
    isLoading: isLoadingRecipes,
    error: recipesError,
  } = useQuery<{ recipes: Recipe[]; pagination: unknown }>({
    queryKey: ["recipes"],
    queryFn: async () => {
      const response = await fetch("/api/recipes?limit=100");
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to fetch recipes");
      }
      const data = (await response.json()) as {
        recipes: Recipe[];
        pagination: unknown;
      };
      return data;
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const recipes = recipesData?.recipes ?? [];

  // Fetch saved meal plans with error handling
  const { data: savedPlans, error: savedPlansError } = useQuery<MealPlan[]>({
    queryKey: ["savedMealPlans"],
    queryFn: async () => {
      const response = await fetch("/api/meal-planner/plans");
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to fetch saved plans");
      }
      return (await response.json()) as MealPlan[];
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Add meal to week mutation with retry and optimistic updates
  const addMealMutation = useMutation({
    mutationFn: async ({
      recipeId,
      date,
      mealType,
    }: { recipeId: number; date: string; mealType: MealType }) => {
      const response = await fetch("/api/meal-planner/current-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId, date, mealType }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to add meal");
      }
      return response.json();
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onMutate: async ({ recipeId, date, mealType }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["currentWeekMeals"] });

      // Snapshot previous value
      const previousMeals = queryClient.getQueryData([
        "currentWeekMeals",
        weekStart.toISOString().split("T")[0],
      ]);

      // Optimistically update
      const recipe = recipes.find((r: Recipe) => r.id === recipeId);
      if (recipe) {
        const optimisticMeal: PlannedMeal = {
          id: -Date.now(),
          userId: "current",
          recipeId,
          date,
          mealType,
          createdAt: new Date().toISOString(),
          recipe,
        };

        queryClient.setQueryData(
          ["currentWeekMeals", weekStart.toISOString().split("T")[0]],
          (old: WeeklyMealPlan = {}) => ({
            ...old,
            [date]: {
              ...old[date],
              [mealType]: optimisticMeal,
            },
          })
        );
      }

      return { previousMeals };
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousMeals) {
        queryClient.setQueryData(
          ["currentWeekMeals", weekStart.toISOString().split("T")[0]],
          context.previousMeals
        );
      }
      handleError(error, "Add meal to plan");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["currentWeekMeals"] });
      toast.success("Meal added successfully!");
    },
  });

  // Remove meal from week mutation with retry and optimistic updates
  const removeMealMutation = useMutation({
    mutationFn: async ({
      date,
      mealType,
    }: { date: string; mealType: MealType }) => {
      const response = await fetch(
        `/api/meal-planner/current-week?date=${date}&mealType=${mealType}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to remove meal");
      }
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onMutate: async ({ date, mealType }) => {
      await queryClient.cancelQueries({ queryKey: ["currentWeekMeals"] });

      const previousMeals = queryClient.getQueryData([
        "currentWeekMeals",
        weekStart.toISOString().split("T")[0],
      ]);

      // Optimistically remove
      queryClient.setQueryData(
        ["currentWeekMeals", weekStart.toISOString().split("T")[0]],
        (old: WeeklyMealPlan = {}) => {
          const newMeals = { ...old };
          if (newMeals[date]) {
            const dayMeals = { ...newMeals[date] };
            delete dayMeals[mealType];
            newMeals[date] = dayMeals;
          }
          return newMeals;
        }
      );

      return { previousMeals };
    },
    onError: (error, variables, context) => {
      if (context?.previousMeals) {
        queryClient.setQueryData(
          ["currentWeekMeals", weekStart.toISOString().split("T")[0]],
          context.previousMeals
        );
      }
      handleError(error, "Remove meal from plan");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["currentWeekMeals"] });
      toast.success("Meal removed successfully!");
    },
  });

  // Save meal plan mutation with retry
  const saveMealPlanMutation = useMutation({
    mutationFn: async ({
      name,
      description,
    }: { name: string; description?: string }) => {
      const response = await fetch("/api/meal-planner/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to save meal plan");
      }
      return response.json();
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["savedMealPlans"] });
      toast.success("Meal plan saved successfully!");
      setShowSaveDialog(false);
      setPlanName("");
    },
    onError: (error) => {
      handleError(error, "Save meal plan");
    },
  });

  // Load meal plan mutation with retry
  const loadMealPlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      const response = await fetch(`/api/meal-planner/plans/${planId}/load`, {
        method: "POST",
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to load meal plan");
      }
      return response.json();
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["currentWeekMeals"] });
      toast.success("Meal plan loaded successfully!");
      setShowLoadDialog(false);
      setSelectedPlanId(null);
    },
    onError: (error) => {
      handleError(error, "Load meal plan");
    },
  });

  // Filter recipes based on search and category - memoized for performance
  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe: Recipe) => {
      const matchesSearch =
        searchTerm === "" ||
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.ingredients.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" ||
        recipe.categories.includes(selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [recipes, searchTerm, selectedCategory]);

  // Handle drag start - memoized
  const handleDragStart = useCallback((recipe: Recipe) => {
    setDraggedRecipe(recipe);
  }, []);

  // Handle drag end - memoized
  const handleDragEnd = useCallback(() => {
    setDraggedRecipe(null);
    setDragOverSlot(null);
  }, []);

  // Handle drag over - memoized
  const handleDragOver = useCallback((date: string, mealType: MealType) => {
    setDragOverSlot({ date, mealType });
  }, []);

  // Handle drag leave - memoized
  const handleDragLeave = useCallback(() => {
    setDragOverSlot(null);
  }, []);

  // Handle meal drop - memoized
  const handleDrop = useCallback(
    (date: string, mealType: MealType) => {
      if (draggedRecipe) {
        addMealMutation.mutate({
          recipeId: draggedRecipe.id,
          date,
          mealType,
        });
      }
      setDraggedRecipe(null);
      setDragOverSlot(null);
    },
    [draggedRecipe, addMealMutation]
  );

  // Handle meal remove - memoized
  const handleMealRemove = useCallback(
    (plannedMeal: PlannedMeal) => {
      removeMealMutation.mutate({
        date: plannedMeal.date,
        mealType: plannedMeal.mealType,
      });
    },
    [removeMealMutation]
  );

  // Handle week navigation - memoized
  const goToPreviousWeek = useCallback(() => {
    const newWeekStart = new Date(weekStart);
    newWeekStart.setDate(weekStart.getDate() - 7);
    setWeekStart(newWeekStart);
  }, [weekStart]);

  const goToNextWeek = useCallback(() => {
    const newWeekStart = new Date(weekStart);
    newWeekStart.setDate(weekStart.getDate() + 7);
    setWeekStart(newWeekStart);
  }, [weekStart]);

  // Handle save week - memoized
  const handleSaveWeek = useCallback(() => {
    setShowSaveDialog(true);
  }, []);

  // Handle load week - memoized
  const handleLoadWeek = useCallback(() => {
    if (!savedPlans?.length) {
      toast.error("No saved meal plans available");
      return;
    }
    setShowLoadDialog(true);
  }, [savedPlans]);

  // Handle generate enhanced shopping list - open modal immediately, then fetch data
  const handleGenerateEnhancedShoppingList = useCallback(() => {
    if (!currentWeekMeals) return;

    // Open modal immediately
    setShowEnhancedShoppingList(true);
    setEnhancedShoppingListData(null); // Clear previous data to show loading

    // Fetch data in background
    const fetchData = async () => {
      try {
        const response = await fetch(
          `/api/shopping-lists/generate-enhanced?weekStart=${weekStart.toISOString().split("T")[0]}`
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Failed to generate shopping list");
        }

        const enhancedData: GenerateEnhancedShoppingListResponse =
          await response.json();
        setEnhancedShoppingListData(enhancedData);
      } catch (error) {
        handleError(error, "Generate shopping list");
        setShowEnhancedShoppingList(false); // Close modal on error
      }
    };

    fetchData();
  }, [currentWeekMeals, weekStart]);

  // Sidebar resize handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isResizing.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;

    const newWidth = e.clientX;
    if (newWidth >= 200 && newWidth <= 400) {
      setSidebarWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  if (isLoadingMeals) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const weekDates = getWeekDates(weekStart);
  const mealTypes: MealType[] = ["breakfast", "lunch", "dinner"];

  return (
    <ErrorBoundary>
      <div className="flex h-screen">
        {/* Resizable Sidebar */}
        <div
          ref={sidebarRef}
          className="border-r flex flex-col relative"
          style={{ width: sidebarWidth }}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3 mb-3">
              <AnimatedBackButton className="h-8 w-8 rounded-full bg-transparent hover:bg-accent flex items-center justify-center">
                <ArrowLeft className="h-4 w-4" />
              </AnimatedBackButton>
              <h2 className="text-lg font-semibold">Recipes</h2>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter Buttons */}
            <div className="flex flex-wrap gap-1">
              {(["All", "Breakfast", "Lunch", "Dinner"] as Category[]).map(
                (category) => (
                  <Button
                    key={category}
                    variant={
                      selectedCategory === category ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={`text-xs ${
                      category !== "All" && selectedCategory === category
                        ? `border-2`
                        : ""
                    }`}
                    style={{
                      borderColor:
                        category !== "All" && selectedCategory === category
                          ? mealTypeColors[category.toLowerCase() as MealType]
                          : undefined,
                      backgroundColor:
                        category !== "All" && selectedCategory === category
                          ? mealTypeColors[category.toLowerCase() as MealType]
                          : undefined,
                    }}
                  >
                    {category}
                  </Button>
                )
              )}
            </div>
          </div>

          {/* Recipe List */}
          <div className="flex-1 overflow-y-auto p-4">
            {recipesError ? (
              <div className="text-center py-8 space-y-4">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
                <div className="text-sm text-muted-foreground">
                  Failed to load recipes. Please try refreshing the page.
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                >
                  Refresh
                </Button>
              </div>
            ) : isLoadingRecipes ? (
              <div className="flex h-64 items-center justify-center">
                <LoadingSpinner size="md" />
              </div>
            ) : filteredRecipes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {recipes.length === 0
                  ? "No recipes found. Add some recipes first!"
                  : "No recipes match your search criteria."}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRecipes.map((recipe: Recipe) => (
                  <MemoizedRecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Resize Handle */}
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-border hover:bg-muted-foreground/20 transition-colors"
            onMouseDown={handleMouseDown}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="border-b p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Meal Planner</h1>

              {/* Week Navigation */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium px-4">
                  {weekStart.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  -{" "}
                  {new Date(
                    weekStart.getTime() + 6 * 24 * 60 * 60 * 1000
                  ).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <Button variant="outline" size="sm" onClick={goToNextWeek}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Weekly Grid */}
          <div className="flex-1 p-4">
            <div className="bg-card rounded-lg border overflow-hidden">
              {/* Grid Header */}
              <div className="grid grid-cols-7 border-b">
                {weekDates.map((date) => {
                  const { dayName, dayNumber, isToday } =
                    formatDateDisplay(date);
                  return (
                    <div
                      key={date}
                      className={`p-3 text-center border-r last:border-r-0 ${
                        isToday ? "bg-primary/10" : "bg-muted"
                      }`}
                    >
                      <div
                        className={`font-medium ${isToday ? "text-primary" : ""}`}
                      >
                        {dayName}
                      </div>
                      <div
                        className={`text-lg ${isToday ? "text-primary font-semibold" : "text-muted-foreground"}`}
                      >
                        {dayNumber}
                      </div>
                      {/* Meal type indicators */}
                      <div className="flex justify-center gap-1 mt-2">
                        {mealTypes.map((mealType) => (
                          <div
                            key={mealType}
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: mealTypeColors[mealType],
                            }}
                            title={mealType}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grid Body */}
              {mealTypes.map((mealType) => (
                <div
                  key={mealType}
                  className="grid grid-cols-7 border-b last:border-b-0"
                >
                  {/* Meal Slots */}
                  {weekDates.map((date) => {
                    const plannedMeal = currentWeekMeals?.[date]?.[mealType];
                    const isDragOver =
                      dragOverSlot?.date === date &&
                      dragOverSlot?.mealType === mealType;

                    return (
                      <MemoizedMealSlot
                        key={`${date}-${mealType}`}
                        date={date}
                        mealType={mealType}
                        plannedMeal={plannedMeal}
                        isDragOver={isDragOver}
                        onDragOver={(e) => {
                          e.preventDefault();
                          handleDragOver(date, mealType);
                        }}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleDrop(date, mealType);
                        }}
                        onMealRemove={handleMealRemove}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Action Bar */}
          <div className="border-t p-4">
            <div className="flex items-center justify-between">
              {/* Color Legend */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-muted-foreground">
                  Meal Types:
                </span>
                {mealTypes.map((mealType) => (
                  <div key={mealType} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: mealTypeColors[mealType] }}
                    />
                    <span className="text-sm text-muted-foreground capitalize">
                      {mealType}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveWeek}
                  disabled={
                    saveMealPlanMutation.isPending ||
                    !currentWeekMeals ||
                    Object.keys(currentWeekMeals).length === 0
                  }
                >
                  {saveMealPlanMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {saveMealPlanMutation.isPending ? "Saving..." : "Save Week"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadWeek}
                  disabled={loadMealPlanMutation.isPending || !!savedPlansError}
                >
                  {loadMealPlanMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FolderOpen className="w-4 h-4 mr-2" />
                  )}
                  {loadMealPlanMutation.isPending ? "Loading..." : "Load Week"}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleGenerateEnhancedShoppingList}
                  disabled={
                    !currentWeekMeals ||
                    Object.keys(currentWeekMeals).length === 0
                  }
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Generate Shopping List
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Plan Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Meal Plan</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter plan name..."
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSaveDialog(false)}
              disabled={saveMealPlanMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => saveMealPlanMutation.mutate({ name: planName })}
              disabled={!planName.trim() || saveMealPlanMutation.isPending}
            >
              {saveMealPlanMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Plan Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Load Meal Plan</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={selectedPlanId?.toString()}
              onValueChange={(value) =>
                setSelectedPlanId(Number.parseInt(value))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a meal plan to load" />
              </SelectTrigger>
              <SelectContent>
                {savedPlans?.map((plan: MealPlan) => (
                  <SelectItem key={plan.id} value={plan.id.toString()}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLoadDialog(false)}
              disabled={loadMealPlanMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedPlanId && loadMealPlanMutation.mutate(selectedPlanId)
              }
              disabled={!selectedPlanId || loadMealPlanMutation.isPending}
            >
              {loadMealPlanMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Shopping List Modal */}
      <Dialog
        open={showEnhancedShoppingList}
        onOpenChange={setShowEnhancedShoppingList}
      >
        <DialogContent className="max-w-6xl w-full h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Generate Shopping List</DialogTitle>
          </DialogHeader>
          <div className="flex-1 py-4 min-h-0">
            {enhancedShoppingListData ? (
              <GeneratedShoppingList
                ingredients={enhancedShoppingListData.ingredients}
                existingItems={enhancedShoppingListData.existingItems}
                onAddToShoppingList={async (
                  ingredients: ProcessedIngredient[]
                ) => {
                  try {
                    setIsAddingToShoppingList(true);

                    const response = await fetch(
                      "/api/shopping-lists/add-from-meal-plan",
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          ingredients: ingredients,
                        }),
                      }
                    );

                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(
                        errorData.error ||
                          "Failed to add items to shopping list"
                      );
                    }

                    const result = await response.json();

                    setShowEnhancedShoppingList(false);
                    toast.success(
                      `Successfully added ${result.addedItems.length} items${
                        result.updatedItems.length > 0
                          ? ` and updated ${result.updatedItems.length} existing items`
                          : ""
                      } to your shopping list!`
                    );
                  } catch (error) {
                    logger.error(
                      "Failed to add ingredients to shopping list",
                      error instanceof Error ? error : new Error(String(error))
                    );
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Failed to add ingredients to shopping list"
                    );
                  } finally {
                    setIsAddingToShoppingList(false);
                  }
                }}
                isLoading={false}
                isAddingToList={isAddingToShoppingList}
              />
            ) : (
              <div className="flex h-full items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
}
