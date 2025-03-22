"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useSearch } from "~/providers";
import type { Recipe, PaginatedResponse } from "~/types";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
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

const ITEMS_PER_PAGE = 12;
type SortOption = "favorite" | "newest" | "oldest";

interface RecipeListClientProps {
  initialData: {
    recipes: Recipe[];
    total: number;
  };
}

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
  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ["recipes", offset],
    queryFn: () => fetchRecipes(offset, ITEMS_PER_PAGE),
    initialData: {
      recipes: initialData.recipes,
      pagination: {
        total: initialData.total,
        offset,
        limit: ITEMS_PER_PAGE,
        hasNextPage: initialData.total > offset + ITEMS_PER_PAGE,
        hasPreviousPage: offset > 0,
        totalPages: Math.ceil(initialData.total / ITEMS_PER_PAGE),
        currentPage,
      },
    },
    staleTime: 1000 * 30,
  });

  const recipes = useMemo(() => data?.recipes ?? [], [data?.recipes]);
  const totalPages = data?.pagination?.totalPages ?? 0;
  const total = data?.pagination?.total ?? 0;

  // Delete mutation
  const deleteRecipeMutation = useMutation({
    mutationFn: deleteRecipe,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["recipes"] });
      const previousRecipes = queryClient.getQueryData<PaginatedResponse>([
        "recipes",
      ]);

      if (previousRecipes) {
        queryClient.setQueryData<PaginatedResponse>(["recipes"], (old) => {
          if (!old) return old;
          return {
            ...old,
            recipes: old.recipes.filter((recipe) => recipe.id !== id),
            pagination: {
              ...old.pagination,
              total: old.pagination.total - 1,
            },
          };
        });
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
    recipes,
    searchTerm,
    sortOption,
  );

  // Smart preloading on hover with rate limiting
  const handleRecipeHover = useCallback(
    (recipe: Recipe) => {
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

  // Prefetch next page with rate limiting
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (currentPage < totalPages) {
      timeoutId = setTimeout(() => {
        const nextPageOffset = currentPage * ITEMS_PER_PAGE;
        void queryClient.prefetchQuery({
          queryKey: ["recipes", nextPageOffset],
          queryFn: () => fetchRecipes(nextPageOffset, ITEMS_PER_PAGE),
          staleTime: 1000 * 30, // Consider data fresh for 30 seconds
        });
      }, 1000); // Delay prefetching by 1 second
    }

    return () => clearTimeout(timeoutId);
  }, [currentPage, totalPages, queryClient]);

  // Event handlers
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
      <div className="mb-4 flex items-center justify-between gap-4">
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
                "border-r",
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setGridView("list")}
              className={cn(
                "hover:bg-accent hover:text-accent-foreground",
                gridView === "list" && "bg-accent text-accent-foreground",
              )}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sortOption} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Sort by</SelectLabel>
                <SelectItem value="favorite">Favorites</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="min-h-[calc(100vh-160px)]">
        <div
          className={cn(
            "flex gap-4 pb-8",
            gridView === "grid"
              ? "flex-wrap justify-center"
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
