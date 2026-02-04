"use client";

import { useState, useRef, useCallback, useMemo, memo, useEffect } from "react";
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
import { Drawer } from "~/components/ui/drawer";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Save,
  FolderOpen,
  ShoppingCart,
  AlertCircle,
  Loader2,
  Menu,
} from "lucide-react";
import { useIsMobile } from "~/hooks/useMediaQuery";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { handleError } from "~/lib/errorHandler";
import { logger } from "~/lib/logger";
import { mealPlannerApi } from "~/utils/api/meal-planner-client";
import { getWeekStart, getWeekDates, formatDateDisplay } from "~/utils/date-helpers";
import { useDragAndDrop } from "~/hooks/useDragAndDrop";
import { currentWeekMealsKey, recipesKey, savedMealPlansKey } from "~/utils/query-keys";

import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { AnimatedBackButton } from "~/components/ui/page-transition";
import { ArrowLeft } from "lucide-react";
import { GeneratedShoppingList } from "./components/GeneratedShoppingList";
import { MealSlot } from "./components/MealSlot";

import type {
  Recipe,
  MealType,
  WeeklyMealPlan,
  Category,
  MealPlan,
  GenerateEnhancedShoppingListResponse,
  ProcessedIngredient,
} from "~/types";
import { mealTypeColors } from "~/constants/meal-planner";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

// Memoized recipe card component for better performance
const MemoizedRecipeCard = memo(
  ({
    recipe,
    onDragStart,
    onDragEnd,
    onTap,
    isSelected,
  }: {
    recipe: Recipe;
    onDragStart?: (recipe: Recipe) => void;
    onDragEnd?: () => void;
    onTap?: (recipe: Recipe) => void;
    isSelected?: boolean;
  }) => {
    const handleDragStart = (e: React.DragEvent) => {
      if (onDragStart) {
        onDragStart(recipe);
        e.dataTransfer.setData("application/json", JSON.stringify(recipe));
      }
    };

    return (
      <div
        draggable={!!onDragStart}
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        onClick={() => onTap?.(recipe)}
        className={`p-3 bg-card rounded-lg border transition-colors ${
          onDragStart ? "cursor-grab active:cursor-grabbing" : "cursor-pointer active:bg-accent"
        } ${isSelected ? "ring-2 ring-primary bg-primary/10" : "hover:bg-accent"}`}
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
    );
  }
);

MemoizedRecipeCard.displayName = "MemoizedRecipeCard";

export function MealPlannerClient() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [weekStart, setWeekStart] = useState<Date>(getWeekStart(new Date()));
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [showRecipeDrawer, setShowRecipeDrawer] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => {
    // Default to today's index within the week (0-6)
    const today = new Date();
    const start = getWeekStart(new Date());
    const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, Math.min(6, diffDays));
  });
  const [pendingRecipe, setPendingRecipe] = useState<Recipe | null>(null);

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

  } = useQuery<WeeklyMealPlan>({
    queryKey: currentWeekMealsKey(weekStart),
    queryFn: () => mealPlannerApi.getCurrentWeekMeals(weekStart),
  });

  // Fetch available recipes with error handling
  const {
    data: recipesData,
    isLoading: isLoadingRecipes,
    error: recipesError,
  } = useQuery<{ recipes: Recipe[]; pagination: unknown }>({
    queryKey: recipesKey(),
    queryFn: () => mealPlannerApi.getRecipes({ limit: 100 }),
  });

  const {
    dragState,
    handleDragStart,
    handleDragEnd,
    handleDrop,
    handleMealRemove,
  } = useDragAndDrop(weekStart);

  // Fetch saved meal plans with error handling
  const { data: savedPlans, error: savedPlansError } = useQuery<MealPlan[]>({
    queryKey: savedMealPlansKey,
    queryFn: () => mealPlannerApi.getSavedMealPlans(),
  });

  // Save meal plan mutation
  const saveMealPlanMutation = useMutation({
    mutationFn: (params: { name: string; description?: string }) =>
      mealPlannerApi.saveMealPlan(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: savedMealPlansKey });
      toast.success("Meal plan saved successfully!");
      setShowSaveDialog(false);
      setPlanName("");
    },
    onError: (error) => {
      handleError(error, "Save meal plan");
    },
  });

  // Load meal plan mutation
  const loadMealPlanMutation = useMutation({
    mutationFn: (planId: number) =>
      mealPlannerApi.loadMealPlan({ mealPlanId: planId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ 
        queryKey: currentWeekMealsKey(weekStart)
      });
      toast.success("Meal plan loaded successfully!");
      setShowLoadDialog(false);
      setSelectedPlanId(null);
    },
    onError: (error) => {
      handleError(error, "Load meal plan");
    },
  });

  const filteredRecipes = useMemo(() => {
    const recipes = recipesData?.recipes ?? [];
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
  }, [recipesData?.recipes, searchTerm, selectedCategory]);

  const goToPreviousWeek = () => {
    const newWeekStart = new Date(weekStart);
    newWeekStart.setDate(weekStart.getDate() - 7);
    setWeekStart(newWeekStart);
  };

  const goToNextWeek = () => {
    const newWeekStart = new Date(weekStart);
    newWeekStart.setDate(weekStart.getDate() + 7);
    setWeekStart(newWeekStart);
  };

  const handleSaveWeek = () => setShowSaveDialog(true);

  const handleLoadWeek = () => {
    if (!savedPlans?.length) {
      toast.error("No saved meal plans available");
      return;
    }
    setShowLoadDialog(true);
  };

  // Handle generate enhanced shopping list - open modal immediately, then fetch data
  const handleGenerateEnhancedShoppingList = useCallback(() => {
    if (!currentWeekMeals) return;

    // Open modal immediately
    setShowEnhancedShoppingList(true);
    setEnhancedShoppingListData(null); // Clear previous data to show loading

    // Fetch data in background
    const fetchData = async () => {
      try {
        const enhancedData = await mealPlannerApi.generateEnhancedShoppingList(weekStart);
        setEnhancedShoppingListData(enhancedData);
      } catch (error) {
        handleError(error, "Generate shopping list");
        setShowEnhancedShoppingList(false); // Close modal on error
      }
    };

    void fetchData();
  }, [currentWeekMeals, weekStart]);

  // Sidebar resize handlers with cleanup
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;

    const newWidth = e.clientX;
    if (newWidth >= 200 && newWidth <= 400) {
      setSidebarWidth(newWidth);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isResizing.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    e.preventDefault();
  }, [handleMouseMove, handleMouseUp]);

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  // Mobile tap-to-place handler
  const handleMobileRecipeTap = useCallback((recipe: Recipe) => {
    setPendingRecipe(recipe);
    setShowRecipeDrawer(false);
  }, []);

  const handleMobilePlacement = useCallback((date: string, mealType: MealType) => {
    if (pendingRecipe) {
      handleDrop(pendingRecipe, date, mealType);
      setPendingRecipe(null);
    }
  }, [pendingRecipe, handleDrop]);

  if (isLoadingMeals) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Recipe list content - shared between sidebar and drawer
  const recipeListContent = (
    <>
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder="Search recipes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category Filter Buttons */}
      <div className="flex flex-wrap gap-1 mb-4">
        {(["All", "Breakfast", "Lunch", "Dinner"] as Category[]).map(
          (category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={`text-xs ${
                category !== "All" && selectedCategory === category
                  ? "border-2"
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

      {/* Recipe List */}
      <div className="flex-1 overflow-y-auto">
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
            {!recipesData?.recipes?.length
              ? "No recipes found. Add some recipes first!"
              : "No recipes match your search criteria."}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRecipes.map((recipe: Recipe) => (
              <MemoizedRecipeCard
                key={recipe.id}
                recipe={recipe}
                onDragStart={isMobile ? undefined : handleDragStart}
                onDragEnd={isMobile ? undefined : handleDragEnd}
                onTap={isMobile ? handleMobileRecipeTap : undefined}
                isSelected={isMobile && pendingRecipe?.id === recipe.id}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen flex-col md:flex-row">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <div
            ref={sidebarRef}
            className="relative flex flex-col border-r bg-black/80 backdrop-blur"
            style={{ width: sidebarWidth }}
          >
            <div className="border-b bg-black p-4">
              <div className="mb-3 flex items-center gap-3">
                <AnimatedBackButton className="flex h-8 w-8 items-center justify-center rounded-md bg-transparent hover:bg-accent">
                  <ArrowLeft className="h-4 w-4" />
                </AnimatedBackButton>
                <h2 className="text-lg font-semibold">Recipes</h2>
              </div>
            </div>
            <div className="flex flex-1 flex-col overflow-hidden p-4">
              {recipeListContent}
            </div>
            <div
              className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-border transition-colors hover:bg-muted-foreground/20"
              onMouseDown={handleMouseDown}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex flex-1 flex-col bg-transparent">
          {/* Header */}
          <div className="border-b bg-black/80 p-3 backdrop-blur md:p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                {isMobile && (
                  <AnimatedBackButton className="flex h-10 w-10 items-center justify-center rounded-md bg-transparent hover:bg-accent">
                    <ArrowLeft className="h-4 w-4" />
                  </AnimatedBackButton>
                )}
                <h1 className="text-xl font-bold md:text-2xl">Meal Planner</h1>
                {isMobile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRecipeDrawer(true)}
                    className="ml-auto"
                  >
                    <Menu className="mr-2 h-4 w-4" />
                    Recipes
                  </Button>
                )}
              </div>

              {/* Week Navigation */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-2 text-center text-xs font-medium md:px-4 md:text-sm">
                  {weekStart.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  -{" "}
                  {new Date(
                    weekStart.getTime() + 6 * 24 * 60 * 60 * 1000
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <Button variant="outline" size="sm" onClick={goToNextWeek}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Weekly Grid */}
          <div className="flex-1 overflow-y-auto p-2 md:overflow-x-auto md:p-4">
            {isMobile ? (
              /* Mobile: Single day with tabs */
              <div className="flex h-full flex-col">
                {/* Day tabs */}
                <div className="mb-3 flex gap-1 overflow-x-auto pb-2">
                  {weekDates.map((date, index) => {
                    const { dayName, dayNumber, isToday } = formatDateDisplay(date);
                    const isSelected = index === selectedDayIndex;
                    return (
                      <button
                        key={date}
                        type="button"
                        onClick={() => setSelectedDayIndex(index)}
                        className={`flex min-w-[52px] flex-col items-center rounded-lg px-3 py-2 text-center transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : isToday
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        <span className="text-xs font-medium">{dayName.slice(0, 3)}</span>
                        <span className="text-lg font-semibold">{dayNumber}</span>
                        <div className="mt-1 flex justify-center gap-0.5">
                          {MEAL_TYPES.map((mealType) => (
                            <div
                              key={mealType}
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: mealTypeColors[mealType] }}
                            />
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Pending recipe indicator */}
                {pendingRecipe && (
                  <div className="mb-3 flex items-center gap-2 rounded-lg bg-primary/10 p-3 border border-primary/30">
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md">
                      <Image
                        src={pendingRecipe.imageUrl}
                        alt={pendingRecipe.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{pendingRecipe.name}</p>
                      <p className="text-xs text-muted-foreground">Tap a meal slot to place</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingRecipe(null)}
                      className="h-8 px-2 text-muted-foreground"
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                {/* Selected day's meals */}
                <div className="flex-1 space-y-3">
                  {MEAL_TYPES.map((mealType) => {
                    const selectedDate = weekDates[selectedDayIndex];
                    const plannedMeal = selectedDate ? currentWeekMeals?.[selectedDate]?.[mealType] : undefined;
                    const isDragOver =
                      dragState.dragOverSlot?.date === selectedDate &&
                      dragState.dragOverSlot?.mealType === mealType;

                    return (
                      <div key={mealType} className="rounded-lg border bg-card">
                        <MealSlot
                          date={selectedDate ?? ""}
                          mealType={mealType}
                          plannedMeal={plannedMeal}
                          onDrop={handleDrop}
                          onRemove={handleMealRemove}
                          isDragOver={isDragOver}
                          isMobile={isMobile}
                          pendingRecipe={pendingRecipe}
                          onMobilePlacement={handleMobilePlacement}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Desktop: 7-column grid */
              <div className="rounded-lg border bg-card">
                {/* Grid Header */}
                <div className="grid grid-cols-7 border-b">
                  {weekDates.map((date) => {
                    const { dayName, dayNumber, isToday } = formatDateDisplay(date);
                    return (
                      <div
                        key={date}
                        className={`border-r p-3 text-center last:border-r-0 ${
                          isToday ? "bg-primary/10" : "bg-muted"
                        }`}
                      >
                        <div className={`text-sm font-medium ${isToday ? "text-primary" : ""}`}>
                          {dayName}
                        </div>
                        <div className={`text-lg ${isToday ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                          {dayNumber}
                        </div>
                        <div className="mt-2 flex justify-center gap-1">
                          {MEAL_TYPES.map((mealType) => (
                            <div
                              key={mealType}
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: mealTypeColors[mealType] }}
                              title={mealType}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Grid Body */}
                {MEAL_TYPES.map((mealType) => (
                  <div key={mealType} className="grid grid-cols-7 border-b last:border-b-0">
                    {weekDates.map((date) => {
                      const plannedMeal = currentWeekMeals?.[date]?.[mealType];
                      const isDragOver =
                        dragState.dragOverSlot?.date === date &&
                        dragState.dragOverSlot?.mealType === mealType;

                      return (
                        <div key={`${date}-${mealType}`} className="border-r border-border last:border-r-0">
                          <MealSlot
                            date={date}
                            mealType={mealType}
                            plannedMeal={plannedMeal}
                            onDrop={handleDrop}
                            onRemove={handleMealRemove}
                            isDragOver={isDragOver}
                            isMobile={false}
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="border-t border-border bg-black/80 p-3 backdrop-blur md:p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Color Legend - hidden on mobile */}
              <div className="hidden items-center gap-4 md:flex">
                <span className="text-sm font-medium text-muted-foreground">Meal Types:</span>
                {MEAL_TYPES.map((mealType) => (
                  <div key={mealType} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: mealTypeColors[mealType] }}
                    />
                    <span className="text-sm capitalize text-muted-foreground">{mealType}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveWeek}
                  disabled={
                    saveMealPlanMutation.isPending ||
                    !currentWeekMeals ||
                    Object.keys(currentWeekMeals).length === 0
                  }
                  className="flex-1 md:flex-none"
                >
                  {saveMealPlanMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    {saveMealPlanMutation.isPending ? "Saving..." : "Save"}
                  </span>
                  <span className="sm:hidden">Save</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadWeek}
                  disabled={loadMealPlanMutation.isPending || !!savedPlansError}
                  className="flex-1 md:flex-none"
                >
                  {loadMealPlanMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FolderOpen className="mr-2 h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    {loadMealPlanMutation.isPending ? "Loading..." : "Load"}
                  </span>
                  <span className="sm:hidden">Load</span>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleGenerateEnhancedShoppingList}
                  disabled={!currentWeekMeals || Object.keys(currentWeekMeals).length === 0}
                  className="w-full md:w-auto"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Generate Shopping List</span>
                  <span className="sm:hidden">Shopping List</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Recipe Drawer */}
        {isMobile && (
          <Drawer open={showRecipeDrawer} onOpenChange={setShowRecipeDrawer} side="left">
            <div className="flex h-full flex-col pt-14">
              <h2 className="mb-4 px-4 text-lg font-semibold">Recipes</h2>
              <div className="flex flex-1 flex-col overflow-hidden px-4 pb-4">
                {recipeListContent}
              </div>
            </div>
          </Drawer>
        )}
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

                    const result = await mealPlannerApi.addToShoppingList({
                      ingredients,
                    });

                    toast.success(
                      `Successfully added ${result.addedItems.length} items${
                        result.updatedItems.length > 0
                          ? ` and updated ${result.updatedItems.length} existing items`
                          : ""
                      } to your shopping list!`,
                      {
                        action: {
                          label: "View Shopping List",
                          onClick: () => router.push("/shopping-lists"),
                        },
                      }
                    );

                    setShowEnhancedShoppingList(false);
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
