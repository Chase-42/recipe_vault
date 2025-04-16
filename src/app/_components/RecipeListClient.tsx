"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useSearch } from "~/providers";
import type { Recipe } from "~/types";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { LayoutGrid, LayoutList, ChevronUp } from "lucide-react";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";

// Components
import RecipeCard from "./RecipeCard";

// Utils & Hooks
import { deleteRecipe, fetchRecipe, fetchRecipes } from "~/utils/recipeService";
import { useFavoriteToggle } from "~/hooks/useFavoriteToggle";
import { useRecipeFiltering } from "~/hooks/useRecipeFiltering";
import { useUrlParams } from "~/hooks/useUrlParams";
import { MAIN_MEAL_CATEGORIES } from "../../types/category";

const ITEMS_PER_PAGE = 12;
type SortOption = "favorite" | "newest" | "oldest";

interface RecipeListClientProps {
  initialData: {
    recipes: Recipe[];
    total: number;
  };
}

// Update type definitions
type Category = "Breakfast" | "Lunch" | "Dinner" | "Dessert" | "all";

type RecipeWithCategories = Recipe & {
  categories?: Category | undefined;
  tags?: string | undefined;
};

type PaginatedRecipeResponse = {
  recipes: RecipeWithCategories[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

// Update the fetchRecipes function type
const fetchRecipesWithTypes = async (
  offset: number,
  limit: number,
): Promise<PaginatedRecipeResponse> => {
  const response = await fetchRecipes(offset, limit);
  return {
    recipes: response.recipes as RecipeWithCategories[],
    pagination: {
      total: response.pagination.total,
      totalPages: Math.ceil(response.pagination.total / limit),
      currentPage: Math.floor(offset / limit) + 1,
      hasNextPage: offset + limit < response.pagination.total,
      hasPreviousPage: offset > 0,
    },
  };
};

export default function RecipeListClient({
  initialData,
}: RecipeListClientProps) {
  const { searchTerm } = useSearch();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { updateParam, getParam } = useUrlParams();
  const { toggleFavorite } = useFavoriteToggle();

  // State
  const [gridView, setGridView] = useState<"grid" | "list">("grid");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");

  // URL params
  const currentPage = Number(getParam("page")) || 1;
  const sortOption = (getParam("sort") as SortOption) || "newest";
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // Scroll handler
  useEffect(() => {
    const scrollContainer = document.querySelector("main");
    if (!scrollContainer) return;

    const handleScroll = () => {
      setShowScrollTop(scrollContainer.scrollTop > 300);
    };

    // Check initial scroll position
    handleScroll();

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    const scrollContainer = document.querySelector("main");
    if (!scrollContainer) return;

    scrollContainer.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  // Data fetching with initial data
  const { data, isLoading } = useQuery<PaginatedRecipeResponse>({
    queryKey: ["recipes", offset],
    queryFn: () => fetchRecipesWithTypes(offset, ITEMS_PER_PAGE),
    initialData: {
      recipes: initialData.recipes as RecipeWithCategories[],
      pagination: {
        total: initialData.total,
        totalPages: Math.ceil(initialData.total / ITEMS_PER_PAGE),
        currentPage: currentPage,
        hasNextPage:
          currentPage < Math.ceil(initialData.total / ITEMS_PER_PAGE),
        hasPreviousPage: currentPage > 1,
      },
    },
    staleTime: 1000 * 30,
  });

  // Update the recipes type
  const recipes = useMemo(() => data?.recipes ?? [], [data?.recipes]);
  const totalPages = data?.pagination?.totalPages ?? 0;
  const total = data?.pagination?.total ?? 0;

  // Update the category filter
  const categoryFilteredRecipes = useMemo(
    () =>
      selectedCategory && selectedCategory !== "all"
        ? recipes.filter((r) => r.categories === selectedCategory)
        : recipes,
    [recipes, selectedCategory],
  );

  // Delete mutation
  const deleteRecipeMutation = useMutation({
    mutationFn: deleteRecipe,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["recipes"] });
      const previousRecipes = queryClient.getQueryData<PaginatedRecipeResponse>(
        ["recipes"],
      );

      if (previousRecipes) {
        queryClient.setQueryData<PaginatedRecipeResponse>(
          ["recipes"],
          (old) => {
            if (!old) return old;
            return {
              ...old,
              recipes: old.recipes.filter((recipe) => recipe.id !== id),
              pagination: {
                ...old.pagination,
                total: old.pagination.total - 1,
              },
            };
          },
        );
      }

      return { previousRecipes };
    },
    onError: (_, __, context) => {
      if (context?.previousRecipes) {
        queryClient.setQueryData(["recipes"], context.previousRecipes);
      }
      toast.error("Failed to delete recipe");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });

  // Event handlers
  const handleDelete = useCallback(
    (id: number) => {
      void deleteRecipeMutation.mutateAsync(id);
    },
    [deleteRecipeMutation],
  );

  const handlePageChange = (page: number) => {
    updateParam("page", page.toString());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSortChange = useCallback(
    (value: SortOption) => {
      updateParam("sort", value);
      if (currentPage !== 1) {
        updateParam("page", "1");
      }
    },
    [currentPage, updateParam],
  );

  // Filter and sort recipes
  const filteredAndSortedRecipes = useRecipeFiltering(
    categoryFilteredRecipes,
    searchTerm,
    sortOption,
  );

  // Smart preloading on hover with rate limiting
  const handleRecipeHover = useCallback(
    (recipe: RecipeWithCategories) => {
      const cacheKey = ["preloadedImages", recipe.id];
      if (!queryClient.getQueryData(cacheKey)) {
        // Load image
        const img = new Image();
        img.src = recipe.imageUrl;
        img.onload = () => {
          queryClient.setQueryData(cacheKey, true);
        };

        // Prefetch recipe data
        void queryClient.prefetchQuery({
          queryKey: ["recipe", recipe.id],
          queryFn: () => fetchRecipe(recipe.id),
          staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
        });

        // Prefetch related routes
        void router.prefetch(`/img/${recipe.id}`);
        void router.prefetch(`/edit/${recipe.id}`);
      }
    },
    [queryClient, router],
  );

  // Update prefetching to use typed function
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (currentPage < totalPages) {
      timeoutId = setTimeout(() => {
        const nextPageOffset = currentPage * ITEMS_PER_PAGE;
        void queryClient.prefetchQuery({
          queryKey: ["recipes", nextPageOffset],
          queryFn: () => fetchRecipesWithTypes(nextPageOffset, ITEMS_PER_PAGE),
          staleTime: 1000 * 30, // Consider data fresh for 30 seconds
        });
      }, 1000); // Delay prefetching by 1 second
    }

    return () => clearTimeout(timeoutId);
  }, [currentPage, totalPages, queryClient]);

  // Update the favorite toggle
  const handleFavoriteToggle = useCallback(
    (id: number) => {
      const recipe = recipes.find((r) => r.id === id);
      if (!recipe) return;
      toggleFavorite(recipe);
    },
    [recipes, toggleFavorite],
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-xl text-red-800">
        Loading recipes...
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {total > 0 && (
              <span>
                Showing {offset + 1}-{Math.min(offset + ITEMS_PER_PAGE, total)}{" "}
                of {total} recipes
              </span>
            )}
          </div>
          <div className="flex items-center rounded-lg border bg-background">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setGridView("grid")}
              className={cn(
                "hover:bg-accent hover:text-accent-foreground",
                gridView === "grid" && "bg-accent text-accent-foreground",
                "border-r p-2 sm:p-3",
              )}
            >
              <LayoutGrid className="h-5 w-5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setGridView("list")}
              className={cn(
                "p-2 hover:bg-accent hover:text-accent-foreground sm:p-3",
                gridView === "list" && "bg-accent text-accent-foreground",
              )}
            >
              <LayoutList className="h-5 w-5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={selectedCategory}
            onValueChange={(value: Category) => setSelectedCategory(value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {MAIN_MEAL_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortOption} onValueChange={handleSortChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="favorite">Favorites First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="min-h-[calc(100vh-160px)]">
        <div
          className={cn(
            "flex gap-6 pb-8",
            gridView === "grid"
              ? "mx-auto flex w-full max-w-[1200px] flex-wrap justify-center"
              : "mx-auto w-full max-w-3xl flex-col items-center",
          )}
        >
          {isLoading ? (
            <div className="flex h-[50vh] w-full items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredAndSortedRecipes.length === 0 ? (
            <div className="flex h-[50vh] w-full items-center justify-center text-lg text-muted-foreground">
              No recipes found
            </div>
          ) : (
            filteredAndSortedRecipes.map((recipe) => (
              <div
                key={recipe.id}
                onMouseEnter={() => handleRecipeHover(recipe)}
                className={cn(
                  gridView === "grid" &&
                    "w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)]",
                )}
              >
                <RecipeCard
                  recipe={recipe}
                  onDelete={handleDelete}
                  onFavoriteToggle={handleFavoriteToggle}
                  priority={currentPage === 1 && recipe.id <= 4}
                />
              </div>
            ))
          )}
        </div>
      </div>

      <Button
        variant="outline"
        size="icon"
        className={cn(
          "fixed bottom-8 right-8 z-[100] h-10 w-10 rounded-full bg-black text-white transition-all duration-300",
          showScrollTop
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0",
        )}
        onClick={scrollToTop}
        aria-label="Scroll to top"
      >
        <ChevronUp className="h-5 w-5" />
      </Button>

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) handlePageChange(currentPage - 1);
                  }}
                  className={
                    currentPage <= 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(page);
                      }}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages)
                      handlePageChange(currentPage + 1);
                  }}
                  className={
                    currentPage >= totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
